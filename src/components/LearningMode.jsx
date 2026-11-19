import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import names from "../data/names";
import { getGoldenLetterProgress, getLearningStats, getNameState, loadProfile, nameId, updateGoals } from "../utils/learningProfile";
import LearningNav from "./LearningNav";
import { downloadDailyReminder } from "../utils/calendarReminder";
import { trackEvent } from "../utils/analytics";
import "../styles/LearningJourney.css";

function nextName(profile) {
  return names.find((name) => getNameState(profile, name) === "review") || names.find((name) => getNameState(profile, name) === "learning") || names.find((name) => getNameState(profile, name) === "new") || names[0];
}

export default function LearningMode() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(loadProfile);
  const [settings, setSettings] = useState(false);
  const [goal, setGoal] = useState(profile.goal || "meanings");
  const [minutes, setMinutes] = useState(profile.goalMinutes || 7);
  const [reminderHour, setReminderHour] = useState(() => Number(localStorage.getItem("reflections_reminder_hour") || 19));
  useEffect(() => { const refresh = () => setProfile(loadProfile()); window.addEventListener("focus", refresh); window.addEventListener("learning-profile-updated", refresh); return () => { window.removeEventListener("focus", refresh); window.removeEventListener("learning-profile-updated", refresh); }; }, []);
  const stats = useMemo(() => getLearningStats(profile), [profile]);
  const current = nextName(profile);
  const entry = profile.names?.[nameId(current)] || null;
  const letters = getGoldenLetterProgress();
  const due = stats.review;
  const suggested = Math.max(3, Math.min(8, due || 4));
  const saveGoals = () => { const next = updateGoals(goal, minutes); setProfile(next); setSettings(false); };
  const addReminder = () => { localStorage.setItem("reflections_reminder_hour", String(reminderHour)); downloadDailyReminder(reminderHour); trackEvent("reminder_download", { reminder_hour: reminderHour }); };

  return <div className="journey-page"><main className="journey-shell">
    <header className="journey-header"><div><div className="journey-brand"><img src="/images/Bismillah.png" alt="" />99 REFLECTIONS</div><h1>Your learning journey</h1><p>Learn with purpose. Remember with consistency.</p></div><button className="settings-button" onClick={() => setSettings(true)} aria-label="Learning goals and settings">⚙</button></header>

    <section className="journey-hero"><div className="hero-copy"><span className="hero-kicker">TODAY'S GUIDED PLAN · ~{profile.goalMinutes || 7} MIN</span><h2>{stats.attempts ? "Welcome back—let’s strengthen what you know." : "Begin gently, one meaningful Name at a time."}</h2><p>{due ? `${due} Name${due === 1 ? " is" : "s are"} ready for review. Your session will mix those with a little new learning.` : "Your first session will introduce a few Names and begin building your personalized review path."}</p><button className="journey-primary" onClick={() => navigate("/smart-learn")}>Start today’s journey <span>→</span></button></div><div className="hero-ring" style={{ "--progress": `${stats.overall * 3.6}deg` }}><div><strong>{stats.overall}%</strong><small>overall</small></div></div></section>

    <section className="journey-strip"><div><span className="strip-icon">🔥</span><strong>{stats.streak} day{stats.streak === 1 ? "" : "s"}</strong><small>current streak</small></div><div><span className="strip-icon">✦</span><strong>{stats.mastered} mastered</strong><small>of 99 Names</small></div><div><span className="strip-icon">◌</span><strong>{stats.retention || "—"}{stats.retention ? "%" : ""}</strong><small>retention</small></div></section>

    <div className="section-heading"><div><span>CONTINUE LEARNING</span><h2>Your next best step</h2></div><button onClick={() => navigate("/learning-progress")}>View progress →</button></div>
    <section className="continue-card"><div className="continue-number">{names.indexOf(current) + 1}</div><div className="continue-arabic" lang="ar" dir="rtl">{current.arabic}</div><div className="continue-copy"><span>{getNameState(profile, current) === "new" ? "NEXT NEW NAME" : "READY TO STRENGTHEN"}</span><h3>{current.name}</h3><p>{current.meaning}</p><div className="thin-track"><span style={{ width: `${Math.min(100, ((entry?.level || 0) / 5) * 100)}%` }} /></div></div><button aria-label={`Study ${current.name}`} onClick={() => navigate(`/flashcards?name=${encodeURIComponent(current.name)}`)}>→</button></section>

    <section className="review-callout"><div className="review-icon">◎</div><div><span>SMART REVIEW</span><h3>{due ? `${due} Names are ready` : "Your memory plan is ready"}</h3><p>{due ? `A ${suggested}-question review will focus on what is fading.` : "Practice now to start building your spaced-review schedule."}</p></div><button onClick={() => navigate("/smart-learn")}>{due ? "Review now" : "Start practice"}</button></section>

    <div className="section-heading courses-heading"><div><span>EXPLORE</span><h2>Your learning paths</h2></div></div>
    <section className="course-grid">
      <button onClick={() => navigate("/quran")}><div className="course-icon teal">۞</div><span className="course-label">READ &amp; REFLECT</span><h3>The Qur’an</h3><p>Read all 114 Surahs in Arabic and English.</p><div className="course-meta"><span>Bookmarks and offline reading</span><b>→</b></div></button>
      <button onClick={() => navigate("/flashcards")}><div className="course-icon gold">✦</div><span className="course-label">FOUNDATION</span><h3>99 Names</h3><p>Meanings, reflections, recall and favorites.</p><div className="course-meta"><span>{stats.mastered}/99 mastered</span><b>→</b></div></button>
      <button onClick={() => navigate("/arabic-alphabet")}><div className="course-icon blue">أ</div><span className="course-label">RECOGNITION</span><h3>Arabic Alphabet</h3><p>Letters, forms, sounds, harakat and quizzes.</p><div className="course-meta"><span>7 guided groups</span><b>→</b></div></button>
      <button onClick={() => navigate("/golden-letters")}><div className="course-icon teal">✎</div><span className="course-label">WRITING</span><h3>Golden Letters</h3><p>Trace, write and connect letters to words.</p><div className="course-meta"><span>{letters}/28 completed</span><b>→</b></div></button>
      <button onClick={() => navigate("/themes")}><div className="course-icon gold">◎</div><span className="course-label">CONNECTIONS</span><h3>Names by Theme</h3><p>Explore mercy, protection, wisdom, provision, and more.</p><div className="course-meta"><span>8 collections</span><b>→</b></div></button>
    </section>

    <section className="weekly-card weekly-recap"><div><span>YOUR LAST 7 DAYS</span><h2>Your quiet progress adds up.</h2><p>{stats.weekMinutes ? `You practiced ${stats.weekNames} Name${stats.weekNames === 1 ? "" : "s"} across ${stats.weekActiveDays} active day${stats.weekActiveDays === 1 ? "" : "s"}.` : "Complete your first session and your weekly story will appear here."}</p><button className="calendar-reminder" onClick={() => setSettings(true)}>Set a daily reminder</button></div><div className="week-numbers"><div className="week-stat"><strong>{stats.weekMinutes}</strong><small>minutes</small></div><div className="week-stat"><strong>{stats.weekNames}</strong><small>Names</small></div><div className="week-stat"><strong>{stats.weekActiveDays}</strong><small>active days</small></div></div></section>
    <button className="journey-secondary wide home-return" onClick={() => navigate("/")}>← Back to Home</button>
  </main><LearningNav />
  {settings && <div className="journey-modal" role="dialog" aria-modal="true" aria-labelledby="goal-title"><div><button className="modal-close" onClick={() => setSettings(false)}>×</button><span className="hero-kicker">PERSONALIZE</span><h2 id="goal-title">Your learning goal</h2><p>Choose what matters most right now. You can change this anytime.</p><label>My focus<select value={goal} onChange={(e) => setGoal(e.target.value)}><option value="meanings">Learn the meanings</option><option value="memorize">Memorize all 99 Names</option><option value="arabic">Recognize the Arabic</option><option value="writing">Learn to write Arabic</option><option value="daily">Build a daily habit</option></select></label><label>Daily pace<select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option></select></label><button className="journey-primary wide" onClick={saveGoals}>Save my goal</button><div className="reminder-setting"><label>Calendar reminder<select value={reminderHour} onChange={(e) => setReminderHour(Number(e.target.value))}><option value="7">7:00 AM</option><option value="12">12:00 PM</option><option value="19">7:00 PM</option><option value="21">9:00 PM</option></select></label><button className="journey-secondary wide" onClick={addReminder}>Add repeating reminder</button><small>Downloads a private recurring calendar event. No account or notification server needed.</small></div></div></div>}
  </div>;
}
