// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import QuranReader from "./QuranReader";
import chapter from "../../public/quran/chapters/59.json";
import chapters from "../../public/quran/chapters.json";

vi.mock("../utils/quranReader", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchWithOfflineCache: vi.fn(async (url) => url.endsWith("chapters.json") ? chapters : chapter) };
});
beforeEach(() => { localStorage.clear(); Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });
describe("Quran canonical deep links", () => {
  it("preserves the selected ayah while normalizing an old link to its canonical path", async () => {
    window.history.replaceState(null, "", "/quran/59?source=name#ayah-21");
    render(<BrowserRouter><Routes><Route path="/quran/:surahNumber" element={<QuranReader />} /></Routes></BrowserRouter>);
    await screen.findByRole("heading", { name: "Al-Hashr", level: 1 });
    await waitFor(() => expect(window.location.pathname).toBe("/quran/59/"));
    expect(window.location.hash).toBe("#ayah-21");
    expect(window.location.search).toBe("?source=name");
    expect(document.getElementById("ayah-21").textContent).toContain(chapter.verses[20].english);
    expect(document.body.classList.contains("quran-reader-active")).toBe(true);
  });
});
