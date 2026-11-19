import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import names from "../data/names";
import { buildReviewQueue, getAchievements, getGoldenLetterProgress, getLearningStats, getNameState, getWeeklySummary, getXpSummary, loadProfile } from "../utils/learningProfile";
import "../styles/JourneyDashboard.css";
import DailyPathCard from "./DailyPathCard";
import ShareMilestoneCard from "./ShareMilestoneCard";
import { getStreakSupport, useStreakShield } from "../utils/dailyEngagement";
import { getQuranProgress, QURAN_PROGRESS_EVENT } from "../utils/quranProgress";

export default function JourneyDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(loadProfile);
  useEffect(() => {
    const refresh = () => setProfile(loadProfile());
    window.addEventListener("focus", refresh);
    window.addEventListener("learning-profile-updated", refresh);
    window.addEventListener("golden-progress-updated", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("learning-profile-updated", refresh); window.removeEventListener("golden-progress-updated", refresh); };
  }, []);
  const stats = useMemo(() => getLearningStats(profile), [profile]);
  const xp = useMemo(() => getXpSummary(profile), [profile]);
  const achievements = useMemo(() => getAchievements(profile), [profile]);
  const week = useMemo(() => getWeeklySummary(profile), [profile]);
  const review = useMemo(() => buildReviewQueue(profile, 3), [profile]);
  const maxMinutes = Math.max(1, ...week.days.map((day) => day.minutes));
  const unlocked = achievements.filter((item) => item.unlocked).length;
  const [streakSupport, setStreakSupport] = useState(() => getStreakSupport(profile));
  const [quranProgress, setQuranProgress] = useState(getQuranProgress);
  useEffect(() => { const refresh = () => setQuranProgress(getQuranProgress()); window.addEventListener(QURAN_PROGRESS_EVENT, refresh); window.addEventListener("focus", refresh); return () => { window.removeEventListener(QURAN_PROGRESS_EVENT, refresh); window.removeEventListener("focus", refresh); }; }, []);

  return <div className="dashboard-page"><main className="dashboard-shell">
    <header className="dashboard-header"><div><button className="dashboard-home-link" onClick={() => navigate("/")}>← Home</button><span className="dashboard-eyebrow">MY DASHBOARD</span><h1>Assalamu Alaikum</h1><p>Every small step is building a lasting connection.</p></div><div className="level-medallion"><strong>{xp.level}</strong><span>LEVEL</span></div></header>

    <section className="dashboard-hero"><div><span className="dashboard-eyebrow">TODAY'S BEST NEXT STEP</span><h2>{stats.review ? `Strengthen ${stats.review} Names ready for review` : "Continue your guided learning journey"}</h2><p>{stats.review ? "A short personalized review will focus on the Names most likely to fade." : "Learn at your pace and your dashboard will build a personalized memory plan."}</p><button onClick={() => navigate(stats.review ? "/smart-review" : "/smart-learn")}>{stats.review ? "Start Smart Review" : "Start today’s lesson"} →</button></div><div className="journey-orbit" style={{ "--progress": `${stats.overall * 3.6}deg` }}><div><strong>{stats.overall}%</strong><span>99 Names</span></div></div></section>

    <section className="dashboard-metrics"><article><span>✦</span><strong>{xp.xp.toLocaleString()}</strong><small>Total XP</small></article><article><span>🔥</span><strong>{stats.streak}</strong><small>Day streak</small></article><article><span>✓</span><strong>{stats.mastered}</strong><small>Mastered</small></article><article><span>✎</span><strong>{getGoldenLetterProgress()}</strong><small>Letters complete</small></article></section>

    <DailyPathCard />
    <section className={`dashboard-card quran-progress-card ${quranProgress.completed ? "complete" : ""}`}><div className="quran-progress-main"><div className="quran-progress-ring" style={{ "--quran-progress": `${quranProgress.percent * 3.6}deg` }}><div><strong>{quranProgress.todayCount}</strong><small>/{quranProgress.goal}</small></div></div><div><span className="dashboard-eyebrow">DAILY QUR’AN CHALLENGE</span><h2>{quranProgress.completed ? "Today’s reading is complete" : `${Math.max(0, quranProgress.goal - quranProgress.todayCount)} ayahs left today`}</h2><p>Build consistency one ayah at a time.</p></div></div><div className="quran-progress-stats"><span><strong>{quranProgress.streak}</strong> day streak</span><span><strong>{quranProgress.total}</strong> ayahs explored</span><span><strong>{quranProgress.surahsExplored}</strong> Surahs opened</span></div><div className="quran-week-dots" aria-label="Last seven days of Quran reading">{quranProgress.week.map((day) => <i key={day.key} className={day.complete ? "complete" : day.count ? "started" : ""} title={`${day.count} ayahs`}><small>{day.label}</small></i>)}</div><button onClick={() => navigate("/quran")}>{quranProgress.completed ? "Continue reading" : "Start today’s challenge"} →</button><small className="quran-next-milestone">Next milestone: {quranProgress.nextMilestone} unique ayahs</small></section>
    <section className="engagement-launches"><button onClick={() => navigate("/name-of-the-day")}><span>☾</span><div><strong>Name of the Day</strong><small>A fresh reflection every day</small></div><b>→</b></button><button onClick={() => navigate("/themed-journeys")}><span>❖</span><div><strong>Seven-Day Journeys</strong><small>Grow through one meaningful theme</small></div><b>→</b></button></section>
    {streakSupport.missedYesterday && <section className="comeback-card"><span>♡</span><div><strong>Welcome back—your progress is safe.</strong><p>{streakSupport.canProtect ? "Use one earned Streak Shield to protect yesterday, then continue gently." : "A short review is the perfect way to begin again."}</p></div>{streakSupport.canProtect ? <button onClick={() => setStreakSupport(useStreakShield())}>Use shield ({streakSupport.shields})</button> : <button onClick={() => navigate("/smart-review")}>Review 3 Names</button>}</section>}

    <section className="xp-card"><div><span className="dashboard-eyebrow">LEVEL {xp.level}</span><h2>{500 - xp.levelXp} XP until Level {xp.level + 1}</h2></div><strong>{xp.levelXp}/500 XP</strong><div className="dashboard-track"><span style={{ width: `${xp.progress}%` }} /></div><small>Correct answers, learning streaks, reflections, mastery, and Arabic writing all earn XP.</small></section>

    <div className="dashboard-two-column"><section className="dashboard-card review-card"><div className="dashboard-card-heading"><div><span className="dashboard-eyebrow">SMART REVIEW</span><h2>Made for your memory</h2></div><button onClick={() => navigate("/smart-review")}>Review all →</button></div>{review.map(({ card, reason }) => <button className="review-row" key={card.name} onClick={() => navigate(`/smart-learn?focus=${names.indexOf(card)}`)}><span lang="ar" dir="rtl">{card.arabic}</span><div><strong>{card.name}</strong><small>{reason}</small></div><b>›</b></button>)}</section>

    <section className="dashboard-card weekly-summary"><div className="dashboard-card-heading"><div><span className="dashboard-eyebrow">LAST 7 DAYS</span><h2>Your weekly rhythm</h2></div><strong>{week.activeDays}/{week.goalDays} days</strong></div><div className="week-chart" aria-label={`${week.minutes} learning minutes this week`}>{week.days.map((day) => <div key={day.key}><span className={day.sessions ? "active" : ""} style={{ height: `${Math.max(day.sessions ? 12 : 3, (day.minutes / maxMinutes) * 72)}px` }} title={`${day.minutes} minutes`} /><small>{day.label}</small></div>)}</div><div className="weekly-totals"><span><strong>{week.minutes}</strong> minutes</span><span><strong>{week.sessions}</strong> sessions</span><span><strong>{week.goalProgress}%</strong> weekly goal</span></div></section></div>

    <section className="dashboard-card mastery-preview"><div className="dashboard-card-heading"><div><span className="dashboard-eyebrow">99 NAMES MASTERY MAP</span><h2>See your knowledge grow</h2></div><button onClick={() => navigate("/learning-progress")}>Open full map →</button></div><div className="mini-mastery-grid">{names.map((card, index) => <button key={`${card.name}-${index}`} className={getNameState(profile, card)} aria-label={`${index + 1}. ${card.name}: ${getNameState(profile, card)}`} title={`${index + 1}. ${card.name}`} onClick={() => navigate(`/smart-learn?focus=${index}`)}>{index + 1}</button>)}</div><div className="mini-legend"><span><i className="mastered" />Mastered</span><span><i className="familiar" />Familiar</span><span><i className="learning" />Learning</span><span><i className="review" />Review</span><span><i />New</span></div></section>

    <section className="dashboard-card achievement-card"><div className="dashboard-card-heading"><div><span className="dashboard-eyebrow">ACHIEVEMENTS</span><h2>{unlocked} of {achievements.length} unlocked</h2></div></div><div className="achievement-grid">{achievements.map((item) => <article key={item.id} className={item.unlocked ? "unlocked achievement-pop" : "locked"}><span>{item.unlocked ? item.icon : "◇"}</span><strong>{item.title}</strong><small>{item.description}</small><div><i style={{width:`${Math.round((item.current/item.goal)*100)}%`}} /></div><em>{item.current.toLocaleString()}/{item.goal.toLocaleString()}</em></article>)}</div></section>
    {stats.attempts > 0 && <ShareMilestoneCard title="My 99 Names Journey" value={`${stats.overall}% complete`} subtitle={`${stats.mastered} Names mastered · ${stats.streak}-day streak`} />}
  </main></div>;
}
