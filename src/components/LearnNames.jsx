import React from "react";
import namesOfAllah from "../data/names"; // your existing file
import "../styles/LearnNames.css";

function LearnNames() {
  return (
    <div className="learn-page">
      <header className="learn-header">
        <h1 className="learn-title">The 99 Names of Allah (Asma’ul Husna)</h1>
        <p className="learn-subtitle">
          Explore all 99 Names of Allah with their meanings. Click any name to
          study it, hear the pronunciation, or open the interactive flashcards.
        </p>
      </header>

      <section className="names-grid">
        {namesOfAllah.map((n, i) => (
          <div key={i} className="name-card">
            <div className="name-arabic">{n.arabic}</div>
            <div className="name-translit">{n.name}</div>
            <div className="name-meaning">{n.meaning}</div>
          </div>
        ))}
      </section>

      <footer className="learn-footer">
        <a href="/flashcard" className="learn-link">
          Start Flashcards →
        </a>
        <a href="/daily-quiz" className="learn-link">
          Try the Daily Quiz →
        </a>
        <a href="/gamer-mode" className="learn-link">
          Play Islamic Games →
        </a>
      </footer>
    </div>
  );
}

export default LearnNames;
