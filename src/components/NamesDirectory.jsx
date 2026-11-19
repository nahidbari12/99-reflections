import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import names from "../data/names";
import { nameSlug } from "../utils/nameRoutes";
import "../styles/Discovery.css";

export default function NamesDirectory() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => names.filter((card) => `${card.name} ${card.meaning} ${card.arabic}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <main className="discovery-page"><nav className="discovery-top"><Link to="/">← Home</Link><Link to="/themes/">Study by theme</Link></nav><header className="directory-header"><span>ASMA’UL HUSNA</span><h1>The 99 Names of Allah</h1><p>Explore each Name, meaning, and reflection—or begin a guided learning journey.</p><input type="search" placeholder="Search by Name or meaning…" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search the 99 Names" /></header><section className="names-directory">{visible.map((card, index) => <Link key={`${card.name}-${index}`} to={`/names/${nameSlug(card, names.indexOf(card))}/`}><span>{names.indexOf(card) + 1}</span><div lang="ar" dir="rtl">{card.arabic}</div><strong>{card.name}</strong><small>{card.meaning}</small></Link>)}</section></main>;
}
