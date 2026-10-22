import './style.css';

// Capture the text passed to the TTS worker so the follow-along view can map
// approximate word timings back to short lyric lines.
const NativeWorker = window.Worker;
window.Worker = class KaraokeWorker extends NativeWorker {
  constructor(url, options) {
    super(new URL(url, document.baseURI), options);
    this.karaokeText = '';
    this.addEventListener('message', event => {
      if (event.data?.type === 'done' && Array.isArray(event.data.timeline)) {
        renderKaraoke(this.karaokeText, event.data.timeline);
      }
    });
  }

  postMessage(message, transfer) {
    if (typeof message?.text === 'string') this.karaokeText = message.text;
    return transfer === undefined
      ? super.postMessage(message)
      : super.postMessage(message, transfer);
  }
};

const audio = document.getElementById('audio');
const karaoke = document.createElement('section');
karaoke.className = 'karaoke';
karaoke.setAttribute('aria-label', 'Karaoke follow-along');
karaoke.innerHTML = '<div class="karaoke-heading"><strong>Follow along</strong><span>Approximate word timing</span></div><div class="karaoke-stage"><div class="karaoke-line previous"></div><div class="karaoke-line current"></div><div class="karaoke-line next"></div></div>';
audio.insertAdjacentElement('afterend', karaoke);

let timeline = [];
let lines = [];
let wordLine = [];
let activeWord = -1;
let activeLine = -1;

function makeLines(text) {
  const words = text.match(/\S+/gu) ?? [];
  const result = [];
  let start = 0;
  for (let i = 0; i < words.length; i += 1) {
    const endOfSentence = /[.!?]["'”’)]*$/u.test(words[i]);
    if ((i - start + 1 >= 8) || (endOfSentence && i - start + 1 >= 4)) {
      result.push(words.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < words.length) result.push(words.slice(start));
  return result;
}

function renderLine(container, line, highlightedWord = -1) {
  container.replaceChildren();
  if (!line) return;
  for (const item of line) {
    const span = document.createElement('span');
    span.className = `karaoke-word${item.index === highlightedWord ? ' active' : ''}`;
    span.dataset.wordIndex = item.index;
    span.textContent = `${item.text} `;
    container.append(span);
  }
}

function showLine(lineIndex, wordIndex = -1) {
  if (lineIndex < 0 || !lines.length) return;
  activeLine = lineIndex;
  renderLine(karaoke.querySelector('.previous'), lines[lineIndex - 1]);
  renderLine(karaoke.querySelector('.current'), lines[lineIndex], wordIndex);
  renderLine(karaoke.querySelector('.next'), lines[lineIndex + 1]);
}

function renderKaraoke(text, wordTimeline) {
  const grouped = makeLines(text);
  let wordIndex = 0;
  lines = grouped.map(group => group.map(word => ({ text: word, index: wordIndex++ })));
  wordLine = new Array(wordIndex);
  lines.forEach((line, lineIndex) => line.forEach(word => { wordLine[word.index] = lineIndex; }));
  timeline = wordTimeline;
  activeWord = -1;
  activeLine = -1;
  karaoke.hidden = false;
  updateHighlight();
}

function updateHighlight() {
  if (!timeline.length || !wordLine.length) return;
  const time = audio.currentTime;
  let low = 0;
  let high = Math.min(timeline.length, wordLine.length) - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const item = timeline[mid];
    if (time < item.start) high = mid - 1;
    else if (time >= item.end) low = mid + 1;
    else {
      const lineIndex = wordLine[mid];
      if (lineIndex !== activeLine) showLine(lineIndex, mid);
      else if (mid !== activeWord) {
        karaoke.querySelector('.karaoke-word.active')?.classList.remove('active');
        const word = [...karaoke.querySelectorAll('.karaoke-line.current .karaoke-word')]
          .find(span => Number(span.dataset.wordIndex) === mid);
        if (word) word.classList.add('active');
      }
      activeWord = mid;
      return;
    }
  }
}

audio.addEventListener('timeupdate', updateHighlight);
audio.addEventListener('seeked', updateHighlight);

await import('./main.js');
