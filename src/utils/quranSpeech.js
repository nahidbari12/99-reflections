export function chooseEnglishVoice(voices = []) {
  return voices.find((voice) => voice.lang?.toLowerCase() === "en-us")
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith("en"))
    || null;
}

export function pauseSiteAudio() {
  if (window.globalMusicAudio && !window.globalMusicAudio.paused) window.globalMusicAudio.pause();
  document.querySelectorAll("audio").forEach((audio) => { if (!audio.paused) audio.pause(); });
}

export function speakEnglishVerse(text, { onStart, onEnd, onError } = {}) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return null;
  window.speechSynthesis.cancel();
  pauseSiteAudio();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = chooseEnglishVoice(window.speechSynthesis.getVoices?.() || []);
  utterance.lang = voice?.lang || "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;
  utterance.onstart = onStart || null;
  utterance.onend = onEnd || null;
  utterance.onerror = onError || null;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopVerseSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
