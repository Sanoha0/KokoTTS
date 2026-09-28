import {KokoroTTS} from 'kokoro-js';
import {env} from '@huggingface/transformers';
import {VOICES,MAX_TEXT,splitText,pcm16,wavBlob} from './audio.js';

env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;

let model;
let engine='CPU';

function progressCallback(progress){
  if(progress.status==='progress'){
    self.postMessage({type:'loading',progress:progress.progress,file:progress.file});
  }
}

async function loadModel(){
  const hasEnoughMemory=(self.navigator.deviceMemory??8)>=6;
  if(self.navigator.gpu&&hasEnoughMemory){
    try{
      self.postMessage({type:'status',message:'Starting fast GPU engine…'});
      model=await KokoroTTS.from_pretrained(
        'onnx-community/Kokoro-82M-v1.0-ONNX',
        {dtype:'fp32',device:'webgpu',progress_callback:progressCallback},
      );
      engine='GPU';
      return;
    }catch{
      self.postMessage({type:'status',message:'GPU unavailable here. Switching to compatible CPU engine…'});
      model=undefined;
    }
  }

  model=await KokoroTTS.from_pretrained(
    'onnx-community/Kokoro-82M-v1.0-ONNX',
    {dtype:'q8',device:'wasm',progress_callback:progressCallback},
  );
  engine='CPU';
}

self.onmessage=async({data})=>{
  try{
    const{text,voice,speed}=data;
    if(
      typeof text!=='string'||!text.trim()||text.length>MAX_TEXT||
      !VOICES.some(item=>item.id===voice)||!Number.isFinite(speed)||speed<.5||speed>2
    )throw Error('Please enter valid text, voice, and speed.');

    if(!model){
      self.postMessage({type:'status',message:'Loading the fastest speech engine for this device…'});
      await loadModel();
    }

    const chunks=splitText(text);
    const parts=[];
    let length=0;
    for(let i=0;i<chunks.length;i++){
      self.postMessage({
        type:'status',
        message:`Creating speech on ${engine} · passage ${i+1} of ${chunks.length}`,
        progress:i/chunks.length*90,
      });
      const audio=await model.generate(chunks[i],{voice,speed});
      if(!audio.audio?.length||!audio.audio.every(Number.isFinite)){
        throw Error('The model returned invalid audio.');
      }
      parts.push(audio.audio);
      length+=audio.audio.length;
    }

    const samples=new Float32Array(length);
    let offset=0;
    for(const part of parts){
      samples.set(part,offset);
      offset+=part.length;
    }

    const wav=wavBlob(samples);
    self.postMessage({type:'status',message:'Preparing MP3 and WAV downloads…',progress:95});
    let mp3=null;
    let mp3Error=null;
    try{
      const{Mp3Encoder}=await import('@breezystack/lamejs');
      const encoder=new Mp3Encoder(1,24000,128);
      const pcm=pcm16(samples);
      const output=[];
      for(let i=0;i<pcm.length;i+=1152){
        const bytes=encoder.encodeBuffer(pcm.subarray(i,i+1152));
        if(bytes.length)output.push(new Uint8Array(bytes));
      }
      const end=encoder.flush();
      if(end.length)output.push(new Uint8Array(end));
      mp3=new Blob(output,{type:'audio/mpeg'});
    }catch(error){
      mp3Error=error.message;
    }

    const peaks=Array.from({length:160},(_,i)=>{
      const start=Math.floor(i*length/160);
      const end=Math.floor((i+1)*length/160);
      let peak=0;
      for(let j=start;j<end;j++)peak=Math.max(peak,Math.abs(samples[j]));
      return peak;
    });
    self.postMessage({type:'done',wav,mp3,mp3Error,duration:length/24000,peaks,engine});
  }catch(error){
    self.postMessage({type:'error',message:error.message||String(error)});
  }
};
