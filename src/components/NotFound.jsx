import React from "react";
import { Link } from "react-router-dom";
import "../styles/Discovery.css";

export default function NotFound() {
  return <main className="discovery-page"><section className="name-detail-card"><h1>Page not found</h1><p>Explore the Names of Allah or return to your learning journey.</p><p><Link to="/">Return to Home</Link> · <Link to="/names/">Explore all 99 Names</Link></p></section></main>;
}
