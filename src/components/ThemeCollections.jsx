import React from "react";
import { Link, useNavigate } from "react-router-dom";
import names from "../data/names";
import themes from "../data/nameThemes";
import { nameSlug } from "../utils/nameRoutes";
import "../styles/Discovery.css";

export default function ThemeCollections() {
  const navigate = useNavigate();
  return <main className="discovery-page"><nav className="discovery-top"><Link to="/">← Home</Link><Link to="/names/">All 99 Names</Link></nav><header className="directory-header"><span>MEANINGFUL CONNECTIONS</span><h1>Learn the Names by theme</h1><p>Build stronger memory by connecting related meanings instead of studying an isolated list.</p></header><section className="theme-grid">{themes.map((theme) => { const cards = names.filter((card) => theme.names.includes(card.name)); return <article key={theme.id}><div className="theme-icon">{theme.icon}</div><h2>{theme.title}</h2><p>{theme.description}</p><div className="theme-names">{cards.map((card) => <Link key={`${theme.id}-${nameSlug(card, names.indexOf(card))}`} to={`/names/${nameSlug(card, names.indexOf(card))}/`}>{card.name}</Link>)}</div><button onClick={() => navigate("/challenge", { state: { difficulty: "medium", reviewNames: cards.map((card) => card.name) } })}>Practice this collection →</button></article>; })}</section></main>;
}
