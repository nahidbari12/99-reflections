import React from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../utils/analytics";
import "../styles/NextStepCard.css";

export default function NextStepCard({ context = "activity", hasMistakes = false }) {
  const navigate = useNavigate();
  const go = (path, action) => { trackEvent("next_step_selected", { source: context, action }); navigate(path); };
  return <aside className="next-step-card"><span>YOUR NEXT BEST STEP</span><h3>{hasMistakes ? "Turn today’s misses into stronger memories." : "Keep your learning momentum going."}</h3><p>{hasMistakes ? "Smart Learn will prioritize Names that need another look." : "A short guided session will choose what your memory needs next."}</p><div><button onClick={() => go("/smart-learn", "smart_learn")}>{hasMistakes ? "Strengthen missed Names" : "Continue learning"} →</button><button onClick={() => go("/themes", "themes")}>Explore a theme</button></div></aside>;
}
