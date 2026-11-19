import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import names from "../data/names";
import reflections from "../data/nameReflections";
import themes from "../data/nameThemes";
import QuranConnection from "./QuranConnection";
import { findNameBySlug, nameSlug } from "../utils/nameRoutes";
import "../styles/Discovery.css";

export default function NameDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const card = findNameBySlug(slug);
  if (!card) return <main className="discovery-page"><section className="name-detail-card"><h1>Name not found</h1><button onClick={() => navigate("/names")}>Explore all Names</button></section></main>;
  const index = names.indexOf(card);
  const previous = names[(index + names.length - 1) % names.length];
  const next = names[(index + 1) % names.length];
  const canonical = `https://99namesofallah.org/names/${nameSlug(card, index)}/`;
  const relatedThemes = themes.filter((theme) => theme.names.includes(card.name));
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.arabic);
    utterance.lang = "ar-SA";
    utterance.rate = 0.72;
    window.speechSynthesis.speak(utterance);
  };
  const share = async () => {
    const text = `${card.name} — ${card.meaning}\n${canonical}`;
    try { if (navigator.share) await navigator.share({ title: `${card.name} — 99 Names of Allah`, text }); else if (navigator.clipboard) await navigator.clipboard.writeText(text); } catch { /* Sharing is optional. */ }
  };

  return <main className="discovery-page">
    
    <nav className="discovery-top"><Link to="/names/">← All Names</Link><Link to="/themes/">Explore themes</Link></nav>
    <article className="name-detail-card">
      <span className="name-number">NAME {index + 1} OF 99</span>
      <div className="name-arabic" lang="ar" dir="rtl">{card.arabic}</div>
      <h1>{card.name}</h1><h2>{card.meaning}</h2>
      <div className="name-tools"><button onClick={speak}>▶ Hear pronunciation</button><button onClick={share}>Share this Name</button></div>
      <section><span>REFLECTION</span><p>{reflections[index]}</p></section>
      <QuranConnection nameIndex={index} />
      {relatedThemes.length > 0 && <div className="related-themes"><span>FOUND IN</span>{relatedThemes.map((theme) => <Link key={theme.id} to="/themes/">{theme.title}</Link>)}</div>}
      <div className="name-actions"><button onClick={() => navigate(`/flashcards?name=${encodeURIComponent(card.name)}`)}>Study this Name</button><button className="secondary" onClick={() => navigate("/smart-learn")}>Add to today’s journey</button></div>
    </article>
    <nav className="name-pagination"><Link to={`/names/${nameSlug(previous, names.indexOf(previous))}/`}>← {previous.name}</Link><Link to={`/names/${nameSlug(next, names.indexOf(next))}/`}>{next.name} →</Link></nav>
  </main>;
}
