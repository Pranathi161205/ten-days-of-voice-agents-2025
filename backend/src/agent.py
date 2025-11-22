import asyncio
import pyttsx3

# Initialize local TTS engine
tts_engine = pyttsx3.init()
tts_engine.setProperty('rate', 150)  # speaking speed

async def handle_message(message: str) -> str:
    """
    Always reply back with a simple response for Day 1.
    """
    reply = f'You said: "{message}". Hello from your Day 1 voice agent!'

    # Speak using local TTS
    tts_engine.say(reply)
    tts_engine.runAndWait()

    return reply

async def main():
    print("Day 1 Voice Agent running... Type something!")
    while True:
        user_input = input("You: ")
        response = await handle_message(user_input)
        print(f"Agent: {response}")

if __name__ == "__main__":
    asyncio.run(main())
