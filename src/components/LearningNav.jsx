import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/LearningJourney.css";

const items = [
  ["/", "⌂", "Home"],
  ["/my-dashboard", "◫", "Dashboard"],
  ["/learning-mode", "☾", "Learn"],
  ["/smart-learn", "◎", "Practice"],
  ["/learning-progress", "◫", "Progress"],
];

export default function LearningNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <nav className="journey-nav" aria-label="Learning navigation">
      {items.map(([path, icon, label]) => (
        <button key={path} className={pathname === path ? "active" : ""} onClick={() => navigate(path)}>
          <span aria-hidden="true">{icon}</span><small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
