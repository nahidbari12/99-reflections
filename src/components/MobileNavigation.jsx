import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/MobileNavigation.css";

const links = [["/", "⌂", "Home"], ["/my-dashboard", "◫", "Dashboard"], ["/learning-mode", "☾", "Learn"], ["/quran", "۞", "Quran"], ["/gamer-mode", "♟", "Games"]];

export function isNavigationActive(pathname, path) {
  if (path === "/") return pathname === "/";
  if (path === "/my-dashboard") return pathname.startsWith("/my-dashboard");
  if (path === "/gamer-mode") return pathname.startsWith("/gamer-mode") || pathname === "/chess-results";
  if (path === "/quran") return pathname.startsWith("/quran");
  return pathname.startsWith("/learning-mode") || pathname.startsWith("/flashcards") || pathname.startsWith("/smart-") || pathname.startsWith("/names") || pathname.startsWith("/themes") || pathname.startsWith("/arabic-");
}
export default function MobileNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const immersive = pathname.startsWith("/smart-learn") || pathname.startsWith("/smart-review") || pathname.startsWith("/gamer-mode/");
  const hasSectionNav = pathname.startsWith("/golden-letters");
  const showGlobalNav = !immersive && !hasSectionNav;
  useEffect(() => {
    document.body.classList.toggle("has-mobile-app-nav", showGlobalNav || hasSectionNav);
    document.body.classList.toggle("immersive-route", immersive);
    return () => { document.body.classList.remove("has-mobile-app-nav"); document.body.classList.remove("immersive-route"); };
  }, [hasSectionNav, immersive, showGlobalNav]);
  if (!showGlobalNav) return null;
  return <><div className="mobile-nav-space" /><nav className="mobile-app-nav" aria-label="Main mobile navigation">{links.map(([path, icon, label]) => <button key={path} className={isNavigationActive(pathname, path) ? "active" : ""} aria-current={isNavigationActive(pathname, path) ? "page" : undefined} onClick={() => navigate(path)} aria-label={label}><span>{icon}</span><small>{label}</small></button>)}</nav></>;
}
