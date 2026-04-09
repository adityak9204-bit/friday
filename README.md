# Friday - Live AI Assistant (Voice + Web)

This project provides a practical assistant scaffold with:

- **Live internet access** through the OpenAI Responses API `web_search_preview` tool.
- **Active listening** in-browser via continuous Speech Recognition.
- **Voice answers** via browser speech synthesis, preferring **Irish English (`en-IE`)** voices when available.
- A customizable assistant persona that can be tuned for tone/accent style and boss/assistant relationship.

> Note: No app can literally perform “all tasks” with unrestricted permissions. This scaffold supports a broad set of safe software tasks and web-grounded answering.

## 1) Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY="your_key"
export BOSS_NAME="Your Name"  # optional
```

## 2) Run

```bash
uvicorn app:app --reload --port 8000
```

Open <http://localhost:8000>

## 3) How it works

- Frontend (`static/app.js`):
  - Captures speech continuously.
  - Sends finalized text to `/ask`.
  - Speaks model responses with the best matching `en-IE` voice.
- Backend (`app.py`):
  - Calls the OpenAI Responses API.
  - Enables live web search tool.
  - Returns text answer for speech playback.

## 4) Tuning an Irish female style

Accent in TTS depends on installed system/browser voices. To improve quality:

1. Install additional Irish-English voices on your OS/browser.
2. Update `pickIrishFemaleVoice()` selection logic in `static/app.js`.
3. Set `BOSS_NAME` (optional) and refine the `SYSTEM_PROMPT` in `app.py`.

## 5) Production notes

- Add authentication and rate-limits to `/ask`.
- Add conversation memory (database / session state).
- Add tool execution layer for calendar/email/file systems.
- Add explicit consent gates before taking high-impact actions.
