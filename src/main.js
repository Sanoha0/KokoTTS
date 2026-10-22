import './style.css';import{VOICES,MAX_TEXT}from'./audio.js';const $=id=>document.getElementById(id),THEMES=['frutiger','frutiger-dark','dark','light'];let selected='af_heart',worker,busy=false,urls=[],peaks=[],jobVoice,jobSpeed;
function applyTheme(theme){const next=THEMES.includes(theme)?theme:'frutiger';document.documentElement.dataset.theme=next;$('theme').value=next;document.querySelector('meta[name="theme-color"]').content=getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();try{localStorage.setItem('kokotts-theme',next)}catch{}}
function say(m,e=false){$('status').textContent=m;$('status').classList.toggle('error',e)}function count(){const n=$('text').value.length;$('count').textContent=`${n.toLocaleString()} / 20,000 characters`;$('generate').disabled=busy||!$('text').value.trim()}function lock(v){busy=v;document.querySelectorAll('#text,#sample,#clear,#file,#accent,#speed,#gender input,#voices input').forEach(x=>x.disabled=v);$('cancel').hidden=!v;$('progress').hidden=!v;$('generate').textContent=v?'Creating your audio…':'✦   Generate speech';count()}
function render(){const gender=document.querySelector('[name=gender]:checked').value,accent=$('accent').value,list=VOICES.filter(v=>v.gender===gender&&(accent==='all'||v.accent===accent));if(!list.some(v=>v.id===selected))selected=list[0].id;$('voices').replaceChildren(...list.map(v=>{const l=document.createElement('label');l.className='voice';l.innerHTML=`<input type="radio" name="voice" value="${v.id}" ${v.id===selected?'checked':''}><b>${v.name[0]}</b><span><strong>${v.name}</strong><small>${v.accent} English</small></span>`;l.querySelector('input').onchange=()=>selected=v.id;return l}))}
function draw(){const c=$('waveform'),w=Math.max(200,c.clientWidth),d=devicePixelRatio||1;c.width=w*d;c.height=70*d;const x=c.getContext('2d');x.scale(d,d);x.fillStyle='#82a15a';const step=w/peaks.length;peaks.forEach((p,i)=>{const h=Math.max(2,p*62);x.fillRect(i*step,(70-h)/2,Math.max(1,step-2),h)})}
function engine(){if(worker)return worker;worker=new Worker(new URL('./tts.worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{if(data.type==='loading'){say(`Loading speech model · ${Math.round(data.progress||0)}%`);$('progress').value=data.progress||0}if(data.type==='status'){say(data.message);data.progress===undefined?$('progress').removeAttribute('value'):$('progress').value=data.progress}if(data.type==='error'){say(`Couldn't generate speech. ${data.message} Check your connection and try again.`,true);worker.terminate();worker=null;lock(false)}if(data.type==='done'){urls.forEach(URL.revokeObjectURL);urls=[];const wav=URL.createObjectURL(data.wav);urls.push(wav);$('audio').src=wav;const name=`KokoTTS-${jobVoice.name.toLowerCase()}-${Date.now()}`;$('download-wav').href=wav;$('download-wav').download=name+'.wav';$('download-mp3').hidden=!data.mp3;if(data.mp3){const mp3=URL.createObjectURL(data.mp3);urls.push(mp3);$('download-mp3').href=mp3;$('download-mp3').download=name+'.mp3'}$('empty').hidden=true;$('result').hidden=false;const sec=Math.round(data.duration);$('audio-meta').textContent=`${jobVoice.name} · ${jobVoice.gender} · ${jobSpeed.toFixed(1)}× · ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;peaks=data.peaks;draw();lock(false);say(data.mp3Error?'Audio ready as WAV. MP3 encoding failed; retry to create it.':'Your audio is ready. Press play or save a copy.',!!data.mp3Error);$('load-note').textContent='Generate again with another voice or speed. Your current recording stays available until the next one is ready.'}};worker.onerror=e=>{say(`The speech engine stopped. ${e.message||'Try a desktop browser.'}`,true);worker?.terminate();worker=null;lock(false)};return worker}
function generate(){if(busy||!$('text').value.trim())return;jobVoice=VOICES.find(v=>v.id===selected);jobSpeed=Number($('speed').value);lock(true);$('progress').removeAttribute('value');say('Starting the speech engine…');engine().postMessage({text:$('text').value,voice:selected,speed:jobSpeed})}
$('text').oninput=count;$('gender').onchange=render;$('accent').onchange=render;$('theme').onchange=e=>applyTheme(e.target.value);$('speed').oninput=()=>$('speed-value').textContent=Number($('speed').value).toFixed(1)+'×';$('generate').onclick=generate;$('cancel').onclick=()=>{worker?.terminate();worker=null;lock(false);say('Cancelled. Your text and previous recording are still here.')};$('sample').onclick=()=>{if($('text').value.trim()&&!confirm('Replace your current text with the example?'))return;$('text').value='Some ideas are better heard. A story on your morning walk. A few notes before a big day. Or a little reminder that the thing you have been meaning to make is worth starting. Give your words a voice, and see where they take you.';count();$('text').focus()};$('clear').onclick=()=>{if($('text').value.trim()&&!confirm('Clear your text? Your generated audio will stay available.'))return;$('text').value='';count();$('text').focus()};$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error('Choose a text file smaller than 100 KB.');const t=await f.text();if(t.length>MAX_TEXT)throw Error('This file exceeds 20,000 characters.');if(t.includes('\0'))throw Error('Choose a plain text or Markdown file.');if($('text').value.trim()&&!confirm('Replace your current text with this file?'))return;$('text').value=t;count();say('Text imported. Choose a voice and generate.')}catch(x){say(x.message,true)}finally{e.target.value=''}};addEventListener('resize',()=>peaks.length&&draw());addEventListener('beforeunload',()=>{urls.forEach(URL.revokeObjectURL);worker?.terminate()});let savedTheme='frutiger';try{savedTheme=localStorage.getItem('kokotts-theme')||'frutiger'}catch{}applyTheme(savedTheme);render();count();
if(document.modelContext?.registerTool)try{Promise.resolve(document.modelContext.registerTool({name:'stage_speech_text',description:'Replace the speech editor text without generating audio.',inputSchema:{type:'object',properties:{text:{type:'string',minLength:1,maxLength:MAX_TEXT}},required:['text'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(busy)throw Error('Wait for generation to finish.');if(!input||typeof input.text!=='string'||!input.text.trim()||input.text.length>MAX_TEXT)throw Error('Provide 1–20,000 characters.');$('text').value=input.text;count();return{characters:input.text.length,ready:true}}})).catch(()=>{})}catch{}

const installButton=$('install');
let deferredInstall=null;
addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredInstall=event;
  installButton.hidden=false;
});
installButton.addEventListener('click',async()=>{
  if(!deferredInstall)return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall=null;
  installButton.hidden=true;
});
addEventListener('appinstalled',()=>{
  deferredInstall=null;
  installButton.hidden=true;
});
if('serviceWorker' in navigator&&location.protocol==='https:'){
  addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

for(const id of ['download-mp3','download-wav']){
  $(id).addEventListener('click',async event=>{
    if(!window.AndroidDownloads)return;
    event.preventDefault();
    const link=event.currentTarget;
    if(!link.href)return;
    try{
      const blob=await fetch(link.href).then(response=>response.blob());
      const dataUrl=await new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>resolve(reader.result);
        reader.onerror=()=>reject(reader.error);
        reader.readAsDataURL(blob);
      });
      window.AndroidDownloads.saveBase64(link.download,blob.type||(
        link.download.endsWith('.mp3')?'audio/mpeg':'audio/wav'
      ),dataUrl);
    }catch(error){
      say('Could not save the audio file. '+(error?.message||'Try again.'),true);
    }
  });
}
