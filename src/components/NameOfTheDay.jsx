import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import reflections from "../data/nameReflections";
import { getNameOfDay, getDailyPath, markDailyStep } from "../utils/dailyEngagement";
import ShareMilestoneCard from "./ShareMilestoneCard";
import "../styles/DailyEngagement.css";

export default function NameOfTheDay() {
  const navigate = useNavigate(); const { card, index } = getNameOfDay();
  const [complete, setComplete] = useState(() => getDailyPath().complete.includes("name"));
  const speak = () => { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const voice = new SpeechSynthesisUtterance(card.arabic); voice.lang = "ar-SA"; voice.rate = .72; speechSynthesis.speak(voice); };
  const reflect = () => { markDailyStep("name", 25); setComplete(true); };
  return <div className="engagement-page"><main className="name-day-shell"><nav><button onClick={() => navigate("/")}>← Home</button><button onClick={() => navigate("/my-dashboard")}>My Dashboard</button></nav><span className="engagement-eyebrow">NAME OF THE DAY · {new Date().toLocaleDateString(undefined,{month:"long",day:"numeric"}).toUpperCase()}</span><section className="name-day-card"><span>NAME {index + 1} OF 99</span><div lang="ar" dir="rtl">{card.arabic}</div><h1>{card.name}</h1><h2>{card.meaning}</h2><button className="listen-name" onClick={speak}>▶ Hear pronunciation</button><article><strong>TODAY'S REFLECTION</strong><p>{reflections[index]}</p></article><aside><strong>A SIMPLE PRACTICE</strong><p>Pause for a moment and consider one place in your life where this Name brings reassurance, gratitude, or guidance.</p></aside><button className={`reflection-complete ${complete ? "done" : ""}`} onClick={reflect}>{complete ? "✓ Reflected today · 25 XP earned" : "I reflected today · Earn 25 XP"}</button></section><ShareMilestoneCard title="Name of the Day" value={card.name} subtitle={card.meaning} /></main></div>;
}
