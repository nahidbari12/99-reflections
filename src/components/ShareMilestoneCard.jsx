import React, { useState } from "react";
import "../styles/DailyEngagement.css";

export default function ShareMilestoneCard({ title, value, subtitle }) {
  const [status, setStatus] = useState("");
  const share = async () => {
    const text = `${title}: ${value}\n${subtitle}\nContinue your journey at https://99namesofallah.org`;
    try { if (navigator.share) await navigator.share({ title: "My 99 Names journey", text }); else { await navigator.clipboard?.writeText(text); setStatus("Copied!"); } }
    catch { setStatus(""); }
  };
  return <aside className="share-milestone"><div><span>✦ 99NamesOfAllah.org</span><h3>{title}</h3><strong>{value}</strong><p>{subtitle}</p></div><button onClick={share}>Share milestone</button>{status && <small role="status">{status}</small>}</aside>;
}
