import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import themes from "../data/nameThemes";
import reflections from "../data/nameReflections";
import names from "../data/names";
import { completeJourneyDay, getActiveJourney, startJourney } from "../utils/dailyEngagement";
import { localDateKey } from "../utils/learningProfile";
import "../styles/DailyEngagement.css";

export default function ThemedJourneys() {
  const navigate = useNavigate(); const [active, setActive] = useState(getActiveJourney);
  const enroll = (id) => { startJourney(id); setActive(getActiveJourney()); };
  const finishDay = () => { completeJourneyDay(); setActive(getActiveJourney()); };
  if (active) { const { theme, progress, cards, current } = active; const index = names.indexOf(current); const completedToday = (progress.completedDates || []).includes(localDateKey()); return <div className="engagement-page"><main className="theme-journey-shell"><nav><button onClick={() => navigate("/my-dashboard")}>← Dashboard</button><button onClick={() => setActive(null)}>All journeys</button></nav><span className="engagement-eyebrow">7-DAY JOURNEY</span><h1>{theme.icon} {theme.title}</h1><p>{theme.description}</p><div className="journey-days">{cards.map((card,i) => <span key={`${card.name}-${i}`} className={i + 1 < progress.day || progress.completed ? "done" : i + 1 === progress.day ? "current" : ""}>{i + 1}</span>)}</div><section className="journey-day-card"><span>DAY {progress.day} OF 7</span><div lang="ar" dir="rtl">{current.arabic}</div><h2>{current.name}</h2><h3>{current.meaning}</h3><p>{reflections[index]}</p><button onClick={finishDay} disabled={completedToday || progress.completed}>{progress.completed ? "Journey complete ✓" : completedToday ? "Today complete · Return tomorrow" : `Complete Day ${progress.day} · Earn ${progress.day === 7 ? 100 : 30} XP`}</button></section></main></div>; }
  return <div className="engagement-page"><main className="theme-journey-shell"><nav><button onClick={() => navigate("/my-dashboard")}>← Dashboard</button></nav><span className="engagement-eyebrow">GUIDED COLLECTIONS</span><h1>Seven days. One meaningful theme.</h1><p>Choose a journey and spend a few quiet minutes with one Name each day.</p><section className="theme-choice-grid">{themes.map((theme) => <article key={theme.id}><span>{theme.icon}</span><h2>{theme.title}</h2><p>{theme.description}</p><small>7 daily reflections · completion badge</small><button onClick={() => enroll(theme.id)}>Begin journey →</button></article>)}</section></main></div>;
}
