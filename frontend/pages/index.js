import React from "react";
import Day1Agent from "../components/Day1Agent"; // correct path after renaming apps/

export default function Home() {
  return (
    <div>
      <header style={{ textAlign: "center", padding: "20px" }}>
        <h1>Day 1 Voice Agent </h1>
        <p>Talk to your agent using your microphone or type a message below.</p>
      </header>

      <main style={{ display: "flex", justifyContent: "center" }}>
        <Day1Agent />
      </main>
    </div>
  );
}
