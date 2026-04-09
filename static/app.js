const askBtn = document.getElementById('askBtn');
const listenBtn = document.getElementById('listenBtn');
const stopBtn = document.getElementById('stopBtn');
const promptEl = document.getElementById('prompt');
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');

let recognition = null;
let listening = false;

function log(message) {
  logEl.textContent = `${message}\n\n${logEl.textContent}`.trim();
}

function pickIrishFemaleVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const exact = voices.find(v => v.lang.toLowerCase().startsWith('en-ie') && /female|samantha|moira|ava|serena/i.test(v.name));
  if (exact) return exact;

  const irish = voices.find(v => v.lang.toLowerCase().startsWith('en-ie'));
  if (irish) return irish;

  const en = voices.find(v => v.lang.toLowerCase().startsWith('en-'));
  return en || voices[0];
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.05;
  const voice = pickIrishFemaleVoice();
  if (voice) utter.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

async function askAssistant(text) {
  statusEl.textContent = 'Status: thinking...';
  const res = await fetch('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  statusEl.textContent = 'Status: ready';
  log(`You: ${text}\n\nFriday: ${data.answer}`);
  speak(data.answer);
}

askBtn.addEventListener('click', async () => {
  const text = promptEl.value.trim();
  if (!text) return;
  try {
    await askAssistant(text);
  } catch (err) {
    statusEl.textContent = 'Status: error';
    log(`Error: ${err.message}`);
  }
});

function setupRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    statusEl.textContent = 'Status: speech recognition not supported in this browser';
    return;
  }

  recognition = new SR();
  recognition.lang = 'en-IE';
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
      } else {
        interim += result[0].transcript;
      }
    }

    promptEl.value = `${finalTranscript}${interim}`.trim();

    if (finalTranscript.trim().endsWith('?') || finalTranscript.trim().toLowerCase().endsWith('friday')) {
      const toSend = finalTranscript.trim();
      finalTranscript = '';
      promptEl.value = '';
      askAssistant(toSend).catch((err) => {
        statusEl.textContent = 'Status: error';
        log(`Error: ${err.message}`);
      });
    }
  };

  recognition.onerror = (e) => {
    log(`Speech error: ${e.error}`);
  };

  recognition.onend = () => {
    if (listening) {
      recognition.start();
    }
  };
}

listenBtn.addEventListener('click', () => {
  if (!recognition) setupRecognition();
  if (!recognition) return;
  listening = true;
  recognition.start();
  statusEl.textContent = 'Status: listening';
});

stopBtn.addEventListener('click', () => {
  listening = false;
  if (recognition) recognition.stop();
  statusEl.textContent = 'Status: stopped';
});

window.speechSynthesis.onvoiceschanged = () => {
  pickIrishFemaleVoice();
};
