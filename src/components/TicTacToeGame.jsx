import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildMeaningQuestion, recordGameAttempt, saveGameResult } from "../utils/gameUtils";
import "../styles/TicTacToeGame.css";

const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function winnerOf(board) { for (const [a,b,c] of WINS) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; return board.includes(null) ? null : "draw"; }
function tactical(board, mark) { for (const line of WINS) { const values = line.map((i) => board[i]); if (values.filter((v) => v === mark).length === 2 && values.includes(null)) return line[values.indexOf(null)]; } return null; }
export function cpuChoice(board) { const open = board.map((v,i) => v === null ? i : null).filter(Number.isInteger); return tactical(board,"O") ?? tactical(board,"X") ?? (board[4] === null ? 4 : null) ?? [0,2,6,8].find((i) => board[i] === null) ?? open[Math.floor(Math.random()*open.length)] ?? null; }

export default function TicTacToeGame() {
  const navigate = useNavigate();
  const [board,setBoard] = useState(Array(9).fill(null));
  const boardRef = useRef(board), statsRef = useRef({correct:0,wrong:0,longest:0,moves:0,wrongAnswers:[]}), penaltyRef = useRef(false), endedRef = useRef(false), phaseRef = useRef("player"), pausedRef = useRef(false), timersRef = useRef(new Set());
  const [status,setStatus] = useState("Your move"), [phase,setPhase] = useState("player"), [question,setQuestion] = useState(null);
  const [selected,setSelected] = useState(null), [locked,setLocked] = useState(false), [questionTimer,setQuestionTimer] = useState(10), [moveTimer,setMoveTimer] = useState(10);
  const [correctCount,setCorrectCount] = useState(0), [wrongCount,setWrongCount] = useState(0), [streak,setStreak] = useState(0), [wrongStreak,setWrongStreak] = useState(0), [notify,setNotify] = useState("");
  const [paused,setPaused] = useState(false);
  const updateBoard = (next) => { boardRef.current = next; setBoard(next); };
  const schedule = (callback, delay) => { const run=()=>{const id=window.setTimeout(()=>{timersRef.current.delete(id);if(pausedRef.current&&!endedRef.current){run();return;}callback();},delay);timersRef.current.add(id);};run(); };
  useEffect(()=>()=>{endedRef.current=true;timersRef.current.forEach(window.clearTimeout);timersRef.current.clear();},[]);
  useEffect(()=>{phaseRef.current=phase;},[phase]);
  useEffect(()=>{pausedRef.current=paused;},[paused]);
  useEffect(()=>{const pauseWhenHidden=()=>{if(document.hidden&&!endedRef.current)setPaused(true);};document.addEventListener("visibilitychange",pauseWhenHidden);return()=>document.removeEventListener("visibilitychange",pauseWhenHidden);},[]);

  const endGame = (outcome) => {
    if (endedRef.current) return; endedRef.current = true;
    const s = statsRef.current; saveGameResult("tic-tac-toe", {outcome,score:s.correct*10});
    navigate("/gamer-mode/results", {state:{outcome,correct:s.correct,wrong:s.wrong,longestStreak:s.longest,totalQuestions:s.correct+s.wrong,wrongAnswers:s.wrongAnswers,moveCount:s.moves}});
  };
  const startPlayerTurn = () => { if(endedRef.current)return; phaseRef.current="player";setPhase("player"); setStatus("Your move"); setMoveTimer(10); };
  const runCpuMove = () => {
    if (endedRef.current||phaseRef.current==="cpu") return; phaseRef.current="cpu";setPhase("cpu"); setStatus("CPU thinking...");
    schedule(() => {
      if(endedRef.current||phaseRef.current!=="cpu")return;
      const current=boardRef.current, move=cpuChoice(current); if (move===null) return endGame("draw");
      const next=[...current]; next[move]="O"; statsRef.current.moves+=1; updateBoard(next);
      const result=winnerOf(next); if (result) return endGame(result==="O"?"lose":"draw");
      if (penaltyRef.current) { penaltyRef.current=false; setNotify("Penalty: CPU moves again"); phaseRef.current="penalty";schedule(()=>{setNotify("");phaseRef.current="question";runCpuMove();},800); } else startPlayerTurn();
    },600);
  };
  useEffect(() => { if (phase!=="player"||paused) return; const id=window.setInterval(()=>setMoveTimer((v)=>Math.max(0,v-1)),1000); return()=>window.clearInterval(id); },[phase,paused]);
  useEffect(()=>{if(phase!=="player"||paused||moveTimer>0||endedRef.current)return;phaseRef.current="transition";setPhase("transition");setNotify("Turn skipped");schedule(()=>{setNotify("");phaseRef.current="question";runCpuMove();},700);},[phase,paused,moveTimer]);

  const resolveAnswer = (choice,timedOut=false) => {
    if(paused||locked||!question)return; setLocked(true);setSelected(choice); const correct=!timedOut&&choice===question.correct;
    recordGameAttempt(question.card,correct,"tic-tac-toe",Math.max(1,10-questionTimer));
    if(correct){ const ns=streak+1; statsRef.current.correct+=1;statsRef.current.longest=Math.max(statsRef.current.longest,ns);setCorrectCount(statsRef.current.correct);setStreak(ns);setWrongStreak(0);
      const bonus=ns===3||ns===5; if(bonus)setNotify(ns===5?"Mastery bonus: CPU skipped":"Streak bonus: CPU skipped");
      schedule(()=>{setNotify("");setQuestion(null);setLocked(false);setSelected(null);if(bonus)startPlayerTurn();else runCpuMove();},bonus?1200:800);
    } else { const nw=wrongStreak+1;statsRef.current.wrong+=1;statsRef.current.wrongAnswers.push({name:question.prompt,correct:question.correct,timedOut});setWrongCount(statsRef.current.wrong);setStreak(0);setWrongStreak(nw);if(nw===3)penaltyRef.current=true;
      setNotify(timedOut?"Time’s up":nw===3?"Three misses: CPU gets a bonus move":"Incorrect"); if(nw>=5)schedule(()=>endGame("lose"),900); else schedule(()=>{setNotify("");setQuestion(null);setLocked(false);setSelected(null);runCpuMove();},900);
    }
  };
  useEffect(()=>{if(phase!=="question"||locked||!question||paused)return;const id=window.setInterval(()=>setQuestionTimer((v)=>Math.max(0,v-1)),1000);return()=>window.clearInterval(id);},[phase,locked,question,paused]);
  useEffect(()=>{if(phase==="question"&&!paused&&!locked&&question&&questionTimer===0)resolveAnswer(null,true);},[phase,paused,locked,question,questionTimer]);

  const handleCellClick=(index)=>{if(paused||phase!=="player"||boardRef.current[index]!==null)return;const next=[...boardRef.current];next[index]="X";statsRef.current.moves+=1;updateBoard(next);const result=winnerOf(next);if(result)return endGame(result==="X"?"win":"draw");phaseRef.current="question";setStatus("Challenge question");setQuestion(buildMeaningQuestion());setQuestionTimer(10);setSelected(null);setLocked(false);setPhase("question");};
  const hearts=Array(5).fill("🖤").map((h,i)=>i<streak?"💛":h);
  return <div className="tictactoe-page">
    {phase==="question"&&question?<div className="tictactoe-question-card fade-in"><div className="tictactoe-question-header"><span className="tictactoe-question-label">Challenge Question</span><span className="tictactoe-question-timer">{questionTimer}s</span></div><h2 className="tictactoe-question-text">{question.prompt}</h2><div className="tictactoe-answer-options grid-2x2">{question.options.map((option)=>{let c="tictactoe-answer-button";if(locked&&option===question.correct)c+=" correct";else if(locked&&selected===option)c+=" wrong";return <button key={option} className={c} onClick={()=>resolveAnswer(option)} disabled={locked}>{option}</button>;})}</div>{notify&&<div className={`notify-banner ${notify.includes("Incorrect")||notify.includes("Time")?"lost":"bonus"}`}>{notify}</div>}</div>
    :<div className="tic-tac-toe-board"><h2 className="move-text">{status}</h2><div className="timer-label">{moveTimer}s</div>{notify&&<div className="notify-banner bonus">{notify}</div>}<div className="board" role="grid" aria-label="Tic-tac-toe board">{board.map((cell,i)=><button key={i} type="button" role="gridcell" aria-label={`Square ${i+1}${cell?`: ${cell}`:""}`} className="cell" onClick={()=>handleCellClick(i)} disabled={phase!=="player"||cell!==null}>{cell}</button>)}</div><div className="streak-meter">{hearts.join(" ")}<div>STREAK · {correctCount} correct · {wrongCount} missed</div></div></div>}
    <div className="tictactoe-controls"><button className="tictactoe-pause-button" onClick={()=>setPaused((value)=>!value)}>{paused?"Resume":"Pause"}</button><button className="back-home-button" onClick={()=>{endedRef.current=true;timersRef.current.forEach(window.clearTimeout);navigate("/gamer-mode");}}>Quit &amp; Exit</button></div>
    {paused&&<div className="tictactoe-pause-overlay" role="dialog" aria-modal="true"><strong>Game paused</strong><span>Timers and CPU actions are stopped.</span><button onClick={()=>setPaused(false)}>Resume game</button></div>}
  </div>;
}
