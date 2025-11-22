import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import pyttsx3

# Initialize TTS engine
tts_engine = pyttsx3.init()
tts_engine.setProperty('rate', 150)

app = FastAPI()

# Allow your frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def handle_message(message: str) -> str:
    reply = f'You said: "{message}". Hello from your Day 1 voice agent!'
    tts_engine.say(reply)
    tts_engine.runAndWait()
    return reply

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Day 1 Voice Agent connected! Say something...")
    while True:
        data = await websocket.receive_text()
        response = await handle_message(data)
        await websocket.send_text(response)
