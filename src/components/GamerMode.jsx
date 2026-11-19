import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLearningStats, loadProfile } from "../utils/learningProfile";
import { loadGameStats } from "../utils/gameUtils";
import "../styles/GamerMode.css";

const GAMES = [
  { id:"birds-of-paradise", to:"/gamer-mode/birds-of-paradise", icon:"🕊", title:"Birds of Paradise", skill:"Quiz + coordination", time:"4–7 min", difficulty:"Gentle" },
  { id:"checkers", to:"/gamer-mode/checkers-quiz", icon:"🚩", title:"Checkers", skill:"Strategy + meanings", time:"8–15 min", difficulty:"Medium" },
  { id:"chess", to:"/gamer-mode/chess-difficulty", icon:"♟", title:"Chess", skill:"Strategy + recall", time:"10–20 min", difficulty:"Choose level" },
  { id:"divine-descent", to:"/gamer-mode/divine-descent", icon:"🌠", title:"Divine Descent", skill:"Fast meaning recall", time:"2–5 min", difficulty:"Adaptive" },
  { id:"name-rush", to:"/gamer-mode/name-rush", icon:"⚡", title:"Name Rush", skill:"Meaning accuracy", time:"1–3 min", difficulty:"Fast" },
  { id:"scramble", to:"/gamer-mode/scramble", icon:"🔤", title:"Scramble", skill:"Name spelling", time:"4–6 min", difficulty:"Medium" },
  { id:"lantern-match", to:"/gamer-mode/lantern-match", icon:"🏮", title:"Lantern Match", skill:"Visual memory + meanings", time:"3–7 min", difficulty:"4 levels" },
  { id:"crossword", to:"/gamer-mode/crossword", icon:"▦", title:"Divine Crossword", skill:"Definitions + spelling", time:"6–12 min", difficulty:"Fresh puzzle" },
  { id:"tic-tac-toe", to:"/gamer-mode/tic-tac-toe", icon:"❌", title:"Tic-Tac-Toe", skill:"Meanings + tactics", time:"3–6 min", difficulty:"Quick" },
];

const quizBattle = { id:"quiz-battle", to:"/gamer-mode/quiz-battle", icon:"⚔️", title:"Quiz Battle", skill:"Private rooms", time:"10 questions", difficulty:"1 vs 1" };
const availableGames = import.meta.env.VITE_MULTIPLAYER_URL ? [...GAMES, quizBattle] : GAMES;

export default function GamerMode() {
  const navigate=useNavigate();
  const [stats,setStats]=useState(loadGameStats);
  useEffect(()=>{const refresh=()=>setStats(loadGameStats());window.addEventListener("game-stats-updated",refresh);return()=>window.removeEventListener("game-stats-updated",refresh);},[]);
  const learning=getLearningStats(loadProfile());
  const recommended=useMemo(()=>GAMES.reduce((best,game)=>(stats[game.id]?.plays||0)<(stats[best.id]?.plays||0)?game:best,GAMES[0]),[stats]);
  return <div className="gamer-mode-page"><div className="gamer-mode-inner">
    <div className="gamer-mode-header"><span className="gamer-eyebrow">PLAY WITH PURPOSE</span><h1>🎮 Gamer Mode</h1><p className="gamer-mode-tagline">Every answer now strengthens your Learn Mode mastery.</p></div>
    <section className="gamer-summary" aria-label="Game learning summary"><div><strong>{learning.attempts}</strong><span>learning answers</span></div><div><strong>{learning.retention}%</strong><span>retention</span></div><div><strong>{Object.values(stats).reduce((sum,item)=>sum+(Number(item?.plays)||0),0)}</strong><span>games played</span></div></section>
    <Link className="recommended-game" to={`${recommended.to}/`}><span>Recommended next</span><strong>{recommended.icon} {recommended.title}</strong><small>{recommended.skill} · {recommended.time}</small></Link>
    <div className="gamer-mode-grid">{availableGames.map((game)=>{const gameStat=stats[game.id];return <Link key={game.id} to={`${game.to}/`} className="game-button active"><span className="game-icon">{game.icon}</span><span className="game-copy"><span className="game-title">{game.title}</span><small>{game.skill} · {game.time}</small></span><span className="game-meta"><b>{game.difficulty}</b><small>{gameStat?`${gameStat.plays} played${gameStat.bestScore?` · Best ${gameStat.bestScore}`:""}`:"New"}</small></span></Link>;})}</div>
    <p className="gamer-mode-mobile-hint">Keyboard controls are supported in Crossword, Scramble, Tic-Tac-Toe, and Birds of Paradise.</p>
    <button className="back-button" onClick={()=>navigate("/")}>← Back to Home</button>
  </div></div>;
}
