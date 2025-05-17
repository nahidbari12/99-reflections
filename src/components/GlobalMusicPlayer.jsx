import React, { useEffect, useRef, useState } from "react";
import themeMusic from "../assets/audio/theme.mp3";
import "../styles/GlobalMusicPlayer.css";

function GlobalMusicPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = isMuted;
    }
  }, [isMuted]);

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
        })
        .catch((err) => {
          console.error("Playback failed:", err);
          alert("⚠️ Audio playback failed. It may be blocked by your browser.");
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

  return (
    <div className="music-controls">
      <audio ref={audioRef} src={themeMusic} preload="auto" loop />
      <button onClick={togglePlay}>
        {isPlaying ? "⏸ Pause" : "▶️ Play"}
      </button>
      <button onClick={toggleMute}>
        {isMuted ? "🔇 Unmute" : "🔊 Mute"}
      </button>
    </div>
  );
}

export default GlobalMusicPlayer;
