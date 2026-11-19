import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Tic-tac-toe responsive controls", () => {
  it("keeps Pause and Quit controls the same pill dimensions", () => {
    const css = readFileSync(new URL("./TicTacToeGame.css", import.meta.url), "utf8");
    expect(css).toContain(".tictactoe-pause-button,.tictactoe-controls .back-home-button{width:148px;height:48px");
    expect(css).toContain("border-radius:999px");
  });
});
