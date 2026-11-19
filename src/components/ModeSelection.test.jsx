// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ModeSelection from "./ModeSelection";

afterEach(cleanup);

function renderRoutes() {
  return render(<MemoryRouter initialEntries={["/mode-selection"]}><Routes>
    <Route path="/mode-selection" element={<ModeSelection />} />
    <Route path="/learning-mode" element={<div>Learning hub destination</div>} />
  </Routes></MemoryRouter>);
}

describe("legacy Mode Selection route", () => {
  it("redirects old bookmarks directly to the Learning hub", () => {
    renderRoutes();
    expect(screen.getByText("Learning hub destination")).toBeTruthy();
  });
});
