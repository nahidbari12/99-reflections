// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chooseEnglishVoice, speakEnglishVerse, stopVerseSpeech } from "./quranSpeech";

describe("Quran English verse audio", () => {
  beforeEach(() => {
    class MockUtterance { constructor(text) { this.text = text; } }
    globalThis.SpeechSynthesisUtterance = MockUtterance;
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel: vi.fn(), speak: vi.fn(), getVoices: vi.fn(() => [{ lang: "ar-SA", name: "Arabic" }, { lang: "en-US", name: "English" }]) } });
  });

  it("prefers a US English voice and uses a calm reading rate", () => {
    expect(chooseEnglishVoice([{ lang: "en-GB" }, { lang: "en-US" }]).lang).toBe("en-US");
    const utterance = speakEnglishVerse("In the name of Allah");
    expect(utterance).toMatchObject({ text: "In the name of Allah", lang: "en-US", rate: 0.88 });
    expect(window.speechSynthesis.cancel).toHaveBeenCalledOnce();
    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(utterance);
  });

  it("stops active speech", () => {
    stopVerseSpeech();
    expect(window.speechSynthesis.cancel).toHaveBeenCalledOnce();
  });
});
