import './style.css';

const NativeWorker=window.Worker;
window.Worker=class KaraokeWorker extends NativeWorker{
  constructor(url,options){
    const workerUrl=new URL(url,document.baseURI);
    super(workerUrl,options);
    this.karaokeText='';
    this.addEventListener('message',event=>{
      if(event.data?.type==='done'&&Array.isArray(event.data.timeline)){
        renderTranscript(this.karaokeText,event.data.timeline);
      }
    });
  }

  postMessage(message,transfer){
    if(typeof message?.text==='string')this.karaokeText=message.text;
    if(transfer===undefined)return super.postMessage(message);
    return super.postMessage(message,transfer);
  }
};

let transcriptWords=[];
let timeline=[];
let activeWord=-1;
const audio=document.getElementById('audio');
const transcript=document.createElement('section');
transcript.className='karaoke';
transcript.setAttribute('aria-label','Follow along with the spoken words');
transcript.innerHTML='<div class="karaoke-heading"><strong>Follow along</strong><span>Approximate word timing</span></div><div class="karaoke-text"></div>';
audio.insertAdjacentElement('afterend',transcript);

function renderTranscript(text,wordTimeline){
  const content=transcript.querySelector('.karaoke-text');
  const fragment=document.createDocumentFragment();
  transcriptWords=[];
  timeline=wordTimeline;
  activeWord=-1;
  for(const token of text.match(/\s+|\S+/gu)??[]){
    if(/^\s+$/u.test(token)){
      fragment.append(document.createTextNode(token));
      continue;
    }
    const span=document.createElement('span');
    span.className='karaoke-word';
    span.textContent=token;
    fragment.append(span);
    transcriptWords.push(span);
  }
  content.replaceChildren(fragment);
  transcript.hidden=false;
  updateHighlight();
}

function updateHighlight(){
  if(!timeline.length||!transcriptWords.length)return;
  const time=audio.currentTime;
  let low=0,high=Math.min(timeline.length,transcriptWords.length)-1;
  while(low<=high){
    const mid=(low+high)>>1,item=timeline[mid];
    if(time<item.start)high=mid-1;
    else if(time>=item.end)low=mid+1;
    else{
      if(activeWord!==mid){
        transcriptWords[activeWord]?.classList.remove('active');
        const word=transcriptWords[mid];
        word.classList.add('active');
        activeWord=mid;
        const box=transcript.querySelector('.karaoke-text');
        if(word.offsetTop<box.scrollTop||word.offsetTop+word.offsetHeight>box.scrollTop+box.clientHeight){
          word.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'});
        }
      }
      return;
    }
  }
  transcriptWords[activeWord]?.classList.remove('active');
  activeWord=-1;
}

audio.addEventListener('timeupdate',updateHighlight);
audio.addEventListener('seeked',updateHighlight);

await import('./main.js');
