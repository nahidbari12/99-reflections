import React from "react";
import { useNavigate } from "react-router-dom";

const items = [
  { key: "home", label: "Home", icon: "⌂", path: "/golden-letters" },
  { key: "learn", label: "Learn", icon: "ا", path: "/golden-letters/letters" },
  { key: "practice", label: "Practice", icon: "✍", path: "/golden-letters/practice" },
  { key: "progress", label: "Progress", icon: "◔", path: "/golden-letters/progress" },
];

export default function GoldenLettersNav({ active }) {
  const navigate = useNavigate();
  return <nav className="gl-bottom-nav" aria-label="Golden Letters navigation">
    {items.map((item) => <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => navigate(item.path)} aria-current={active === item.key ? "page" : undefined}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
  </nav>;
}

