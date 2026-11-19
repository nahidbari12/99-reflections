import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import themeMusic from "../assets/audio/theme.mp3";
import "../styles/GlobalMusicPlayer.css";

function GlobalMusicPlayer() {
  const { pathname } = useLocation();
  const hiddenForQuran = /(^|\/)quran(?:\/|$)/i.test(pathname);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("reflections_music_collapsed") === "1"; }
    catch { return false; }
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    try { window.localStorage.setItem("reflections_music_collapsed", isCollapsed ? "1" : "0"); }
    catch { /* Continue without saving the display preference. */ }
  }, [isCollapsed]);

  useEffect(() => {
    if (!hiddenForQuran) return;
    audioRef.current?.pause();
    setIsPlaying(false);
    setMessage("");
  }, [hiddenForQuran]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setMessage("");
        })
        .catch(() => {
          setMessage("Your browser blocked audio. Tap Play again.");
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  if (hiddenForQuran) return null;

  return (
    <aside className={`music-player ${isCollapsed ? "collapsed" : "expanded"}`} aria-label="Background music controls">
      <audio ref={audioRef} src={themeMusic} preload="auto" loop />
      {isCollapsed ? (
        <button className={`music-expand-button ${isPlaying && !isMuted ? "playing" : ""}`} onClick={() => setIsCollapsed(false)} aria-label="Expand music controls" aria-expanded="false">
          <span aria-hidden="true">♪</span><span className="music-collapsed-label">Music</span>
        </button>
      ) : (
        <>
          <div className="music-player-header">
            <span className={`music-status-dot ${isPlaying && !isMuted ? "playing" : ""}`} aria-hidden="true" />
            <span>Background music</span>
            <button className="music-collapse-button" onClick={() => setIsCollapsed(true)} aria-label="Collapse music controls" aria-expanded="true">−</button>
          </div>
          <div className="music-actions">
            <button onClick={togglePlay} aria-pressed={isPlaying} aria-label={isPlaying ? "Pause background music" : "Play background music"}>{isPlaying ? "⏸ Pause" : "▶ Play"}</button>
            <button onClick={toggleMute} aria-pressed={isMuted} aria-label={isMuted ? "Unmute background music" : "Mute background music"}>{isMuted ? "🔇 Unmute" : "🔊 Mute"}</button>
          </div>
          {message && <span className="music-message" role="status">{message}</span>}
        </>
      )}
    </aside>
  );
}

export default GlobalMusicPlayer;
