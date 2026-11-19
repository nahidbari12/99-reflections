// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import GlobalMusicPlayer from "./GlobalMusicPlayer";

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("homepage actions", () => {
  it("shows direct learning, dashboard, gamer mode, and continue actions", () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /View all learning activities/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /My Dashboard/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Gamer Mode/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Continue where you left off.*Learning Journey/i })).toBeTruthy();
  });
});

describe("global music controls", () => {
  it("collapses, expands, and remembers the compact preference", () => {
    const view = render(<MemoryRouter><GlobalMusicPlayer /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Collapse music controls/i }));
    expect(screen.getByRole("button", { name: /Expand music controls/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Play background music/i })).toBeNull();
    expect(localStorage.getItem("reflections_music_collapsed")).toBe("1");
    view.unmount();
    render(<MemoryRouter><GlobalMusicPlayer /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /Expand music controls/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Expand music controls/i }));
    expect(screen.getByRole("button", { name: /Play background music/i })).toBeTruthy();
  });

  it("is completely removed throughout the Quran section", () => {
    render(<MemoryRouter initialEntries={["/quran/1"]}><GlobalMusicPlayer /></MemoryRouter>);
    expect(screen.queryByLabelText(/Background music controls/i)).toBeNull();
    expect(document.querySelector("audio")).toBeNull();
  });

  it("also removes music for case and nested-path Quran route variations", () => {
    render(<MemoryRouter initialEntries={["/99-reflections/Quran/1"]}><GlobalMusicPlayer /></MemoryRouter>);
    expect(screen.queryByLabelText(/Background music controls/i)).toBeNull();
    expect(document.querySelector("audio")).toBeNull();
  });
});
