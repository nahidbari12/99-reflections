import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDailyPath } from "../utils/dailyEngagement";
import "../styles/DailyEngagement.css";

const steps = [
  ["name", "Name of the Day", "/name-of-the-day", "☾"], ["learn", "Guided lesson", "/smart-learn", "✦"],
  ["review", "Smart Review", "/smart-review", "◎"], ["quiz", "Daily Quiz", "/daily-quiz", "✓"],
];
export default function DailyPathCard({ compact = false }) {
  const navigate = useNavigate(); const [path, setPath] = useState(getDailyPath);
  useEffect(() => { const refresh = () => setPath(getDailyPath()); window.addEventListener("daily-engagement-updated", refresh); return () => window.removeEventListener("daily-engagement-updated", refresh); }, []);
  return <section className={`daily-path-card ${compact ? "compact" : ""}`}><header><div><span>TODAY'S PATH</span><h2>{path.count === path.total ? "Today’s journey is complete" : `${path.count} of ${path.total} steps complete`}</h2></div><strong>{path.percent}%</strong></header><div className="daily-path-track"><span style={{ width: `${path.percent}%` }} /></div><div className="daily-path-steps">{steps.map(([id, label, route, icon]) => <button key={id} className={path.complete.includes(id) ? "done" : ""} onClick={() => navigate(route)}><i>{path.complete.includes(id) ? "✓" : icon}</i><span>{label}</span></button>)}</div></section>;
}
