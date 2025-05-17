// /src/components/About.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/About.css";

function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div className="about-content">
        <h1>📜 About & Disclaimer</h1>

        <p>
          <strong>99 Reflections</strong> is a private, educational application created to help users
          learn and reflect on the 99 Names of Allah through a gamified experience.
        </p>

        <p>
          This app is for personal and private use only. Redistribution, duplication, reverse engineering,
          modification, or any commercial use of this app is strictly prohibited without the express
          written permission of the creator.
        </p>

        <p>
          All intellectual property rights, including design, code, UI/UX, and content, are the exclusive
          property of the creator.
        </p>

        <p>
          🎵 Background music credit: <strong>Muhammad Al Muqit</strong>. All rights to the audio remain
          with the original artist. Used here for non-commercial, respectful educational use only.
        </p>

        <p>
          This app does not collect, store, or share any user data. All user activity remains local to
          your device unless you're using multiplayer features which only transmit temporary, non-personal
          game session data.
        </p>

        <p>
          For inquiries, feedback, or permissions, contact:
          <br />
          <a href="mailto:99ReflectionsApp@gmail.com">99ReflectionsApp@gmail.com</a>
        </p>

        <button className="back-home-button" onClick={() => navigate("/")}>
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
}

export default About;
