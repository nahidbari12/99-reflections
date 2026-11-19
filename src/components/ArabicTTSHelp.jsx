// /src/components/ArabicTTSHelp.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ArabicTTSHelp.css";

function CollapsibleSection({ title, subtitle, steps, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`tts-help-section ${open ? "open" : ""}`}>
      <button
        type="button"
        className="tts-help-section-header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="tts-help-section-text">
          <h2 className="tts-help-section-title">{title}</h2>
          {subtitle && (
            <p className="tts-help-section-subtitle">{subtitle}</p>
          )}
        </div>
        <span className="tts-help-section-icon">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="tts-help-section-body">
          <ol className="tts-help-steps">
            {steps.map((step, idx) => (
              <li key={idx} className="tts-help-step">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function ArabicTTSHelp() {
  const navigate = useNavigate();

  return (
    <div className="tts-help-page">
      <div className="tts-help-inner">
        {/* Header */}
        <header className="tts-help-header">
          <h1 className="tts-help-title">Arabic Audio Help</h1>
          <p className="tts-help-subtitle">
            Follow the steps for your device to enable Arabic text-to-speech.
            Once Arabic voices are installed, the{" "}
            <strong>“Hear in Arabic”</strong> button on the 
            page will start working.
          </p>
        </header>

        {/* Info banner */}
        <div className="tts-help-banner">
          <p>
            <strong>Note:</strong> After you add a new language or voice,
            it may take a few minutes before apps can use it. If the
            Arabic audio doesn’t work right away, wait a bit and then
            refresh this site.
          </p>
        </div>

        {/* PLATFORM SECTIONS */}
        <CollapsibleSection
          title="Windows (PC)"
          subtitle="Add Arabic to Windows and enable Arabic text-to-speech."
          defaultOpen={false}
          steps={[
            "Open the Start menu and go to Settings.",
            "Select “Time & language”, then choose “Language & region”.",
            "Click “Add a language” and search for “Arabic”. Choose the Arabic variant you prefer (for example, Arabic (Saudi Arabia)).",
            "Install the language pack. If there is an option for “Speech” or “Text-to-speech”, make sure it is selected.",
            "After installation completes, open Settings → Time & language → Speech and check under “Voices” that an Arabic voice is available.",
            "If needed, restart your browser (or your computer) so the new voice is detected.",
            "Return to 99NamesOfAllah.org and try the “Hear in Arabic” button again. It may take a few minutes before the new voice is available in all apps."
          ]}
        />

        <CollapsibleSection
          title="macOS (MacBook / iMac)"
          subtitle="Add an Arabic system voice on your Mac."
          steps={[
            "Click the Apple menu  and open System Settings (or System Preferences on older macOS).",
            "Go to “Accessibility” and then choose “Spoken Content” (or “Speech” on some versions).",
            "Look for the list of system voices and click “Manage Voices…” or a similar option.",
            "Find Arabic voices in the list. Select one or more Arabic voices and download them.",
            "After the download finishes, set an Arabic voice as the active voice for testing (you can switch back later if you like).",
            "Close Settings and restart your browser if needed so it picks up the new voices.",
            "Return to 99NamesOfAllah.org and try the “Hear in Arabic” button. It can take a few minutes after download before the new voice is available to all apps."
          ]}
        />

        <CollapsibleSection
          title="iPhone / iPad (iOS / iPadOS)"
          subtitle="Turn on Arabic voices for Safari and apps."
          steps={[
            "Open the Settings app on your iPhone or iPad.",
            "Scroll down and tap “Accessibility”.",
            "Tap “Spoken Content” (or “Speech” on some versions).",
            "Tap “Voices”, then choose a language section and look for Arabic. Download at least one Arabic voice you like.",
            "After the download completes, make sure that Arabic appears in your list of voices.",
            "Optionally, turn on “Speak Selection” or “Speak Screen” so you can test the voice system-wide.",
            "Open Safari again, go back to 99NamesOfAllah.org and tap “Hear in Arabic”. Sometimes iOS needs a few minutes after a download before the new voice is available to websites."
          ]}
        />

        <CollapsibleSection
          title="Android Phones & Tablets"
          subtitle="Enable Arabic in system text-to-speech settings."
          steps={[
            "Open the Settings app on your Android device.",
            "Search for “Text-to-speech” or go to System → Languages & input → Text-to-speech output (exact path may vary by device).",
            "Open the Text-to-speech engine settings (for example Google Text-to-speech).",
            "Look for “Install voice data” or “Download languages” and find Arabic in the list.",
            "Download the Arabic voice (or voices) you prefer.",
            "After download, make sure Arabic appears as an available voice. On some devices you may need to select it as a preferred language for TTS.",
            "Close and reopen your browser, then revisit 99NamesOfAllah.org and try “Hear in Arabic”. It can take a short time after download before the voice is ready for use."
          ]}
        />

        {/* Back Button */}
        <div className="tts-help-back-row">
          <button
            type="button"
            className="tts-help-back-button"
            onClick={() => navigate(-1)}
          >
            ⬅ Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArabicTTSHelp;
