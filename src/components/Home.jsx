import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLearningStats, loadProfile } from "../utils/learningProfile";
import { trackEvent } from "../utils/analytics";
import { loadLastVisitedPage } from "../utils/lastVisited";
import DailyPathCard from "./DailyPathCard";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const stats = useMemo(() => getLearningStats(loadProfile()), []);
  const returning = stats.attempts > 0;
  const lastVisited = useMemo(loadLastVisitedPage, []);

  const open = (path, label) => {
    trackEvent("home_action", { action: label });
    navigate(path);
  };

  const openChallenge = () => open("/daily-challenge", "daily_challenge");

  return (
    <div className="home-container">
      <div className="home-inner">
        <div className="home-badge">99NamesOfAllah.org</div>
        <div className="home-banner">
          <div className="home-glow-orbit" />
          <span className="home-kicker">LEARN · REMEMBER · REFLECT</span>
          <h1 className="home-title">Build a lasting connection with the 99 Names of Allah</h1>
          <p className="home-subtitle">A calm daily learning journey with smart review, reflections, Arabic practice, and meaningful challenges.</p>
          {returning && <div className="home-progress"><span><strong>{stats.mastered}</strong> mastered</span><span><strong>{stats.streak}</strong> day streak</span><span><strong>{stats.overall}%</strong> journey</span></div>}
        </div>

        <div className="home-actions">
          <button className="start-button" onClick={() => open("/smart-learn", returning ? "continue_journey" : "start_first_lesson")}>{returning ? "Continue today’s journey" : "Start a guided lesson"}<span>→</span></button>
          <p className="home-trust">Free · no account needed · progress stays on your device</p>
          <button className="dashboard-button" onClick={() => open("/my-dashboard", "my_dashboard")}><span aria-hidden="true">◫</span><strong>My Dashboard</strong><small>XP, achievements, mastery and weekly progress</small><b aria-hidden="true">→</b></button>
          <DailyPathCard compact />
          <div className="home-quick-actions">
            <button onClick={() => open("/quran", "read_quran")}><span>۞</span><strong>Read Qur’an</strong><small>Arabic and English</small></button>
            <button onClick={() => open("/daily-quiz", "daily_quiz")}><span>🌙</span><strong>Daily Quiz</strong><small>A quick return habit</small></button>
            <button onClick={openChallenge}><span>🎯</span><strong>Daily Challenge</strong><small>10 shared questions</small></button>
            <button onClick={() => open("/gamer-mode", "gamer_mode")}><span>♟</span><strong>Gamer Mode</strong><small>Choose from 9 games</small></button>
          </div>
          <button className="home-game-return" onClick={() => open(lastVisited.path, "continue_last_page")}><span>{lastVisited.icon}</span><span><small>CONTINUE WHERE YOU LEFT OFF</small><strong>{lastVisited.label}</strong></span><b>→</b></button>
          <div className="home-discovery-links"><Link to="/names/" onClick={() => trackEvent("home_action", { action: "browse_names" })}>Browse all 99 Names</Link><span>·</span><Link to="/themes/" onClick={() => trackEvent("home_action", { action: "browse_themes" })}>Explore by theme</Link></div>
          <button className="explore-button" onClick={() => open("/learning-mode", "view_learning_activities")}><span aria-hidden="true">✨</span> View all learning activities <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>
  );
}

export default Home;
