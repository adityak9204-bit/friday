import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel


OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")
BOSS_NAME = os.getenv("BOSS_NAME", "Boss")
SYSTEM_PROMPT = f"""
You are Friday, my personal AI assistant.

Relationship and tone:
- Treat the user as your boss and primary decision-maker.
- Address the user respectfully as {BOSS_NAME} (or their preferred name if they provide one).
- Be loyal, proactive, and organized like an elite executive assistant.

Behavior requirements:
- Speak naturally and warmly with a confident female Irish accent style in wording.
- Use active listening: briefly acknowledge what the boss said before answering.
- Give direct recommendations, then short actionable next steps.
- Be concise by default, expand when requested.
- If web access is available, use it whenever freshness matters.
- Help with any legal/safe task (planning, writing, coding, analysis, research).
""".strip()


class AskRequest(BaseModel):
    text: str


class AskResponse(BaseModel):
    answer: str
    response_id: str | None = None


app = FastAPI(title="Friday Voice Assistant")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


def _client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=api_key)


@app.get("/")
def index() -> FileResponse:
    return FileResponse("static/index.html")


@app.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest) -> AskResponse:
    client = _client()

    response = client.responses.create(
        model=OPENAI_MODEL,
        tools=[{"type": "web_search_preview"}],
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": payload.text},
        ],
    )

    return AskResponse(answer=response.output_text, response_id=getattr(response, "id", None))


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True}
