import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/QuizBattle.css";

const endpoint = (import.meta.env.VITE_MULTIPLAYER_URL || "").replace(/\/+$/, "");
const codePattern = /^[A-F0-9]{10}$/;
const randomHex = size => Array.from(crypto.getRandomValues(new Uint8Array(size)),
  byte => byte.toString(16).padStart(2, "0")).join("");
const identityKey = "reflection-quiz-battle-profile";

function readIdentity() {
  try { return JSON.parse(localStorage.getItem(identityKey)); } catch { return null; }
}

async function api(path, body) {
  const response = await fetch(endpoint + path, {
    ...(body && { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Multiplayer is temporarily unavailable.");
  return data;
}

export default function QuizBattle() {
  const [params] = useSearchParams();
  const [identity, setIdentity] = useState(readIdentity);
  const [username, setUsername] = useState(identity?.username || "");
  const [code, setCode] = useState((params.get("room") || "").toUpperCase().slice(0, 10));
  const [active, setActive] = useState(null);
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [submitted, setSubmitted] = useState("");
  const [leaders, setLeaders] = useState(null);
  const [leaderError, setLeaderError] = useState(false);
  const token = useRef(identity?.token);
  const socket = useRef(null);
  const mounted = useRef(false);
  const leaderboardRequest = useRef(0);

  async function loadLeaders() {
    if (!endpoint) return;
    const request = ++leaderboardRequest.current;
    setLeaderError(false);
    try {
      const data = await api("/leaderboard");
      if (request === leaderboardRequest.current && mounted.current) setLeaders(data.players);
    } catch {
      if (request === leaderboardRequest.current && mounted.current) setLeaderError(true);
    }
  }

  useEffect(() => {
    mounted.current = true;
    loadLeaders();
    return () => { mounted.current = false; };
  }, []);

  const rankedMatch = room?.phase === "finished" && !room.rankingPending ? room.match : null;
  useEffect(() => { if (rankedMatch) loadLeaders(); }, [rankedMatch]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let retry;
    let handshake;
    let failures = 0;
    let joined = false;

    function connect() {
      const url = new URL(endpoint + "/rooms/" + active.code + "/" + (joined ? "join" : active.mode));
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(url);
      socket.current = ws;
      handshake = setTimeout(() => ws.close(), 12000);
      ws.onopen = () => ws.send(JSON.stringify({ type: "hello", token: token.current }));
      ws.onmessage = event => {
        const state = JSON.parse(event.data);
        if (state.type !== "state" || cancelled) return;
        clearTimeout(handshake);
        joined = true;
        failures = 0;
        setOnline(true);
        setError("");
        setRoom({ ...state, until: performance.now() + state.remaining });
      };
      ws.onclose = event => {
        clearTimeout(handshake);
        if (cancelled) return;
        setOnline(false);
        if (![1008, 4001].includes(event.code) && failures++ < 4) {
          retry = setTimeout(connect, 500 * 2 ** failures);
          return;
        }
        setError(event.reason || "Connection lost. Join the room again using its code.");
        setCode(active.code);
        setActive(null);
        setRoom(null);
      };
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retry);
      clearTimeout(handshake);
      socket.current?.close();
      socket.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!room?.until) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((room.until - performance.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 150);
    return () => clearInterval(interval);
  }, [room?.until]);

  async function enter(mode) {
    if (mode === "join" && !codePattern.test(code)) {
      setError("Enter the 10-character room code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      token.current ||= randomHex(32);
      const profile = await api("/profile", { token: token.current, username });
      if (!mounted.current) return;
      setUsername(profile.username);
      setIdentity(profile);
      try { localStorage.setItem(identityKey, JSON.stringify({ ...profile, token: token.current })); } catch {}
      setSubmitted("");
      setActive({ mode, code: mode === "create" ? randomHex(5).toUpperCase() : code });
    } catch (err) {
      if (mounted.current) setError(err.message === "Failed to fetch" ? "Could not reach multiplayer. Try again." : err.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  function send(type, extra) {
    if (!online || socket.current?.readyState !== WebSocket.OPEN) return false;
    socket.current.send(JSON.stringify({ type, ...extra }));
    return true;
  }

  async function copyInvite() {
    const url = new URL(window.location.href);
    url.searchParams.set("room", room.code);
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice("Invite link copied.");
    } catch {
      setNotice("Share the room code shown above.");
    }
  }

  const bothOnline = room?.players.length === 2 && room.players.every(player => player.connected);
  const round = room && room.match + ":" + room.number;
  const winner = room?.players.length === 2 && room.players[0].score !== room.players[1].score
    ? room.players.reduce((best, player) => player.score > best.score ? player : best)
    : null;

  return (
    <main className="quiz-battle">
      <Link to="/gamer-mode/">← Gamer Mode</Link>
      <h1>Quiz Battle</h1>
      <p>Challenge a friend to 10 questions on the meanings of Allah’s names.</p>

      {!endpoint && <p role="status">Online play is currently unavailable.</p>}
      {error && <p className="battle-error" role="alert">{error}</p>}
      {endpoint && !active && (
        <form className="battle-panel" onSubmit={event => { event.preventDefault(); enter("join"); }}>
          <label>Username
            <input required value={username} onChange={event => setUsername(event.target.value)}
              autoComplete="nickname" maxLength={40} readOnly={!!identity?.username} />
          </label>
          <small>Your username and best completed score appear on the public leaderboard. This browser remembers your profile.</small>
          <button type="button" disabled={busy || !username.trim()} onClick={() => enter("create")}>Create private room</button>
          <label>Room code
            <input value={code} onChange={event => setCode(event.target.value.toUpperCase().trim())}
              autoComplete="off" spellCheck="false" maxLength={10} />
          </label>
          <button disabled={busy || !username.trim()}>Join room</button>
        </form>
      )}
      {active && !online && <p role="status">{room ? "Reconnecting to the battle…" : "Connecting to the room…"}</p>}
      {active && (
        <section className="battle-panel" aria-label="Private room">
          <div className="battle-row">
            <strong>Room <code>{active.code}</code></strong>
            <button onClick={() => { setActive(null); setRoom(null); setOnline(false); setNotice(""); }}>Leave room</button>
          </div>
          {room && (
            <>
              <ul className="battle-scores" aria-label="Live scores">
                {room.players.map((player, index) => (
                  <li key={player.username}>
                    <span>{player.username}{room.you === index ? " (you)" : ""}</span>
                    <strong>{player.score} / {room.total}</strong>
                    <small>{!player.connected ? "Disconnected" : player.answered && room.phase === "question" ? "Answered" : ""}</small>
                  </li>
                ))}
              </ul>
              {room.phase === "lobby" && (
                <>
                  <p role="status">{bothOnline ? "Both players are ready." : "Waiting for your opponent to connect."}</p>
                  <div className="battle-row">
                    <button onClick={copyInvite}>Copy invite link</button>
                    {room.you === 0 && <button disabled={!online || !bothOnline} onClick={() => send("start")}>Start battle</button>}
                  </div>
                  {notice && <small role="status">{notice}</small>}
                </>
              )}
              {room.question && (
                <>
                  <div className="battle-row"><span>Question {room.number} of {room.total}</span>
                    {room.phase === "question" && <span aria-label="Seconds remaining">{seconds}s</span>}
                  </div>
                  <h2><span lang="ar" dir="rtl">{room.question.arabic}</span> · {room.question.name}</h2>
                  <div className="battle-options">
                    {room.question.options.map((option, index) => (
                      <button key={option} disabled={!online || room.phase !== "question" || !seconds || room.answer !== null || submitted === round}
                        className={room.question.correct === index ? "battle-correct" : room.answer === index ? "battle-selected" : ""}
                        onClick={() => {
                          if (send("answer", { choice: index, match: room.match, number: room.number })) setSubmitted(round);
                        }}>{option}</button>
                    ))}
                  </div>
                  {room.phase === "reveal" && <p role="status">Correct answer · {room.question.options[room.question.correct]}</p>}
                </>
              )}
              {room.phase === "finished" && (
                <>
                  <h2 role="status">{winner ? winner.username + " wins!" : "It’s a tie!"}</h2>
                  {room.rankingPending && <p role="status">Saving leaderboard scores…</p>}
                  <button disabled={!online || !bothOnline || room.rankingPending || room.players[room.you].ready}
                    onClick={() => send("rematch")}>{room.players[room.you].ready ? "Waiting for opponent" : "Play rematch"}</button>
                </>
              )}
            </>
          )}
        </section>
      )}

      {endpoint && <section className="battle-panel" aria-labelledby="battle-rankings">
        <div className="battle-row"><h2 id="battle-rankings">Global Top 50</h2><button onClick={loadLeaders}>Refresh</button></div>
        <p>Ranked by best completed battle score. Tied scores are ordered by username.</p>
        {leaderError && <p role="status">Could not load the leaderboard. Try refreshing.</p>}
        {!leaderError && leaders === null && <p role="status">Loading leaderboard…</p>}
        {leaders?.length === 0 && <p>No completed battles yet.</p>}
        {!!leaders?.length && <ol>{leaders.map(player => (
          <li key={player.username}><span>{player.username}</span> <strong>{player.best} / 10</strong></li>
        ))}</ol>}
      </section>}
    </main>
  );
}
