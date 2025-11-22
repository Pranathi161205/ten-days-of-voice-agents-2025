import pyttsx3
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import re

# Initialize TTS
tts_engine = pyttsx3.init()
tts_engine.setProperty('rate', 150)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_memory = []

# Safe math evaluation
def evaluate_math(expr: str) -> str:
    # Only allow digits, operators, parentheses, and spaces
    if re.match(r'^[0-9+\-*/().\s]+$', expr):
        try:
            result = eval(expr)
            return str(result)
        except:
            return "I couldn't calculate that. Please try again."
    return None

async def handle_message(message: str) -> str:
    msg_lower = message.lower().strip()
    reply = ""

    # Check if message is a math expression
    math_result = evaluate_math(msg_lower)
    if math_result is not None:
        reply = f"The answer is {math_result}."
    elif any(greet in msg_lower for greet in ["hi", "hello", "hey"]):
        reply = "Hi! How can I assist you today?"
    elif "how are you" in msg_lower:
        reply = "I'm good, thanks! How's your day going?"
    elif "help" in msg_lower:
        reply = "Sure! I can help you with anything you need. What would you like to do?"
    elif "great" in msg_lower or "good" in msg_lower:
        reply = "That's wonderful to hear!"
    elif "what are you doing" in msg_lower:
        reply = "I'm here to assist you with any questions or tasks you have!"
    elif "teach" in msg_lower or "learn" in msg_lower:
        reply = "Yes! I can teach you. Ask me a question or say something like 'What is 2+2?'"
    elif "math" in msg_lower or "mathematics" in msg_lower:
        reply = "Great! Let's start with math. You can ask me simple calculations like '3 + 5' or '12 / 4'."
    elif "eat" in msg_lower:
        reply = "I don't eat, but I hope you had a good meal!"
    elif any(bye in msg_lower for bye in ["bye", "see you"]):
        reply = "Goodbye! Talk to you later."
    else:
        if conversation_memory:
            reply = f"Oh, I see! You said '{message}'. Tell me more."
        else:
            reply = "That's interesting! Can you tell me more?"

    conversation_memory.append({"user": message, "agent": reply})

    # Speak locally
    tts_engine.say(reply)
    tts_engine.runAndWait()

    return reply

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Day 1 Voice Agent ready! Speak now.")
    while True:
        data = await websocket.receive_text()
        response = await handle_message(data)
        if response:
            await websocket.send_text(response)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server_livekit:app", host="127.0.0.1", port=8000, reload=True)
