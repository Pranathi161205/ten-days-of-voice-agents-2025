import React, { useState, useEffect, useRef } from "react";

const Day1Agent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const recognitionRef = useRef(null);

  // --- WebSocket Setup ---
  useEffect(() => {
    ws.current = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.current.onopen = () => console.log("Connected to backend");

    ws.current.onmessage = (event) => {
      const reply = event.data;
      if (reply.trim() === "") return; // ignore empty replies
      addMessage("Agent", reply);
      speak(reply);
    };

    ws.current.onclose = () => console.log("WebSocket disconnected");

    return () => ws.current.close();
  }, []);

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  const sendMessage = (text) => {
  if (!text || !ws.current) return;
  addMessage("You", text);
  
  // Wait until WebSocket is open
  if (ws.current.readyState === WebSocket.OPEN) {
    ws.current.send(text);
  } else {
    ws.current.addEventListener("open", () => {
      ws.current.send(text);
    }, { once: true });
  }

  setInput("");
};


  // --- Speech Recognition ---
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Your browser does not support Speech Recognition");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // stop after one sentence
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event) => {
      const speech = event.results[event.results.length - 1][0].transcript;
      sendMessage(speech);
    };

    recognitionRef.current.onerror = (event) => console.error("Speech recognition error:", event.error);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  // --- Browser TTS ---
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div style={{
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
      background: "linear-gradient(to bottom right, #89f7fe, #66a6ff)",
      borderRadius: "10px"
    }}>
      <h2>Day 1 Voice Agent Demo</h2>
      <div style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "10px",
        height: "300px",
        overflowY: "auto",
        marginBottom: "10px",
        backgroundColor: "rgba(255,255,255,0.3)"
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ margin: "5px 0" }}>
            <b>{msg.sender}:</b> {msg.text}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
        style={{ width: "70%", padding: "8px" }}
      />
      <button onClick={() => sendMessage(input)} style={{ padding: "8px 12px", marginLeft: "5px" }}>Send</button>

      <div style={{ marginTop: "10px" }}>
        <button onClick={startListening} style={{ marginRight: "5px" }}>🎤 Speak</button>
        <button onClick={stopListening}>🛑 Stop</button>
      </div>
    </div>
  );
};

export default Day1Agent;
