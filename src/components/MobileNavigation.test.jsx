// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MobileNavigation, { isNavigationActive } from "./MobileNavigation";

afterEach(() => { cleanup(); document.body.className = ""; });

describe("mobile fixed-control clearance", () => {
  it("marks regular routes so music docks above the mobile navigation", () => {
    render(<MemoryRouter initialEntries={["/"]}><MobileNavigation /></MemoryRouter>);
    expect(document.body.classList.contains("has-mobile-app-nav")).toBe(true);
  });

  it("does not reserve navigation clearance on immersive routes", () => {
    render(<MemoryRouter initialEntries={["/smart-review"]}><MobileNavigation /></MemoryRouter>);
    expect(document.body.classList.contains("has-mobile-app-nav")).toBe(false);
    expect(document.body.classList.contains("immersive-route")).toBe(true);
  });

  it("defers to section navigation while preserving music clearance", () => {
    const { container } = render(<MemoryRouter initialEntries={["/golden-letters"]}><MobileNavigation /></MemoryRouter>);
    expect(container.querySelector(".mobile-app-nav")).toBeNull();
    expect(document.body.classList.contains("has-mobile-app-nav")).toBe(true);
  });

  it("keeps the correct major section active on nested routes", () => {
    expect(isNavigationActive("/names/ar-rahman", "/learning-mode")).toBe(true);
    expect(isNavigationActive("/gamer-mode/chess", "/gamer-mode")).toBe(true);
    expect(isNavigationActive("/quran/36", "/quran")).toBe(true);
    expect(isNavigationActive("/gamer-mode/chess", "/")).toBe(false);
  });
});
