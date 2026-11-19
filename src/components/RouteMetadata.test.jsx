// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import RouteMetadata from "./RouteMetadata";

function Navigation() {
  const navigate = useNavigate();
  return <><button onClick={() => navigate("/names/ar-rahman/?study=1#reflection")}>Name</button><button onClick={() => navigate("/quran/59/#ayah-21")}>Quran</button><button onClick={() => navigate("/my-dashboard/")}>Dashboard</button><button onClick={() => navigate("/missing-page/")}>Missing</button></>;
}
beforeEach(() => { document.head.innerHTML = '<link rel="canonical" href="https://99namesofallah.org/" /><meta name="description" content="Home" />'; });
afterEach(cleanup);
describe("route search metadata", () => {
  it("updates one canonical and schema through navigation, with query and fragment excluded", () => {
    render(<MemoryRouter><RouteMetadata /><Navigation /></MemoryRouter>);
    fireEvent.click(screen.getByText("Name"));
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelector('link[rel="canonical"]').href).toBe("https://99namesofallah.org/names/ar-rahman/");
    expect(document.title).toContain("Ar-Rahman");
    fireEvent.click(screen.getByText("Quran"));
    expect(document.head.querySelector('link[rel="canonical"]').href).toBe("https://99namesofallah.org/quran/59/");
    expect(document.title).toContain("Al-Hashr");
    expect(document.head.querySelectorAll("#page-schema").length).toBe(1);
    expect(JSON.parse(document.head.querySelector("#page-schema").textContent).url).toBe("https://99namesofallah.org/quran/59/");
  });
  it("keeps personal screens and unknown URLs out of search, and restores indexable metadata", () => {
    render(<MemoryRouter><RouteMetadata /><Navigation /></MemoryRouter>);
    fireEvent.click(screen.getByText("Dashboard"));
    expect(document.head.querySelector('meta[name="robots"]').content).toBe("noindex, follow");
    fireEvent.click(screen.getByText("Missing"));
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.title).toBe("Page not found | 99 Reflections");
    fireEvent.click(screen.getByText("Name"));
    expect(document.head.querySelector('meta[name="robots"]').content).toBe("index, follow");
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelector('meta[property="og:url"]').content).toBe("https://99namesofallah.org/names/ar-rahman/");
  });
});
