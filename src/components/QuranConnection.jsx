import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getQuranConnection, quranConnectionLabel } from "../data/quranConnections";
import { fetchWithOfflineCache } from "../utils/quranReader";

export default function QuranConnection({ nameIndex, compact = false }) {
  const connection = getQuranConnection(nameIndex);
  const [verse, setVerse] = useState(null);
  useEffect(() => {
    if (!connection || compact) return;
    let active = true;
    fetchWithOfflineCache(`/quran/chapters/${connection.surah}.json`).then((chapter) => {
      if (active) setVerse(chapter.verses.find((item) => item.number === connection.ayah) || null);
    }).catch(() => {});
    return () => { active = false; };
  }, [connection, compact]);
  if (!connection) return null;
  const href = `/quran/${connection.surah}/#ayah-${connection.ayah}`;
  if (compact) return <Link className="flashcard-quran-link" to={href}>۞ Read the Qur’an connection · {connection.reference}</Link>;
  return <section className="quran-connection" aria-labelledby="quran-connection-title">
    <div className="quran-connection-heading"><div><span>QUR’AN CONNECTION</span><h3 id="quran-connection-title">{quranConnectionLabel(connection)}</h3></div><b>{connection.reference}</b></div>
    {verse ? <><p className="quran-connection-arabic" lang="ar" dir="rtl">{verse.arabic}</p><p className="quran-connection-english">“{verse.english}”</p></> : <p className="quran-connection-loading">Open the ayah to read it in Arabic and English.</p>}
    <Link className="quran-connection-link" to={href}>Read Surah {connection.surah}, Ayah {connection.ayah} in the Qur’an →</Link>
    {connection.type === "contextual" && <small>This traditional Name is connected through the ayah’s wording or meaning rather than appearing as the exact title.</small>}
  </section>;
}
