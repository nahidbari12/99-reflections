import { describe, expect, it } from "vitest";
import { feedbackForScore, scoreCanvasPixels } from "./goldenLettersCanvas";

function pixels(width, height, points) {
  const data = new Uint8ClampedArray(width * height * 4);
  points.forEach(([x, y]) => { data[(y * width + x) * 4 + 3] = 255; });
  return { data };
}

describe("Golden Letters canvas scoring", () => {
  it("rejects an empty attempt", () => {
    const result = scoreCanvasPixels(pixels(20, 20, [[5, 5]]), pixels(20, 20, []), 20, 20);
    expect(result.hasEnoughInk).toBe(false);
    expect(result.score).toBe(0);
  });

  it("gives aligned writing a stronger score than distant writing", () => {
    const guidePoints = [];
    const alignedPoints = [];
    const distantPoints = [];
    for (let y = 5; y < 25; y += 1) for (let x = 5; x < 15; x += 1) { guidePoints.push([x, y]); alignedPoints.push([x, y]); distantPoints.push([x + 20, y]); }
    const aligned = scoreCanvasPixels(pixels(50, 35, guidePoints), pixels(50, 35, alignedPoints), 50, 35, 3);
    const distant = scoreCanvasPixels(pixels(50, 35, guidePoints), pixels(50, 35, distantPoints), 50, 35, 3);
    expect(aligned.score).toBeGreaterThan(distant.score);
    expect(aligned.score).toBeGreaterThan(80);
  });

  it("returns actionable feedback", () => {
    expect(feedbackForScore({ hasEnoughInk: false }, "trace").title).toBe("Keep going");
    expect(feedbackForScore({ hasEnoughInk: true, score: 90, precision: 90 }, "trace").tone).toBe("great");
  });
});

