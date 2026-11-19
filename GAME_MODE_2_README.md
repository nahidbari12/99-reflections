# 99 Reflections — Gamer Mode 2.0

This release keeps the website fully static and compatible with Replit and GitHub Pages. Ludo was intentionally left unchanged and remains unavailable from the Gamer Mode hub.

## Major fixes

- Added a shared, duplicate-safe question generator.
- Connected game answers and mistakes to the Learn Mode mastery profile.
- Added persistent play counts, best scores, outcomes, and recommendations.
- Prevented duplicate answers and repeated timeout submissions.
- Added route-level and game-rule regression tests.
- Split game screens into on-demand bundles for faster initial loading.
- Removed unused server and multiplayer dependencies from the static build.

### Tic-Tac-Toe

- CPU takes winning moves before blocking and uses better fallback choices.
- Question timeouts count as mistakes and reset streaks.
- Streak rewards and three-miss penalties now affect gameplay.
- Final results use current statistics rather than stale delayed state.
- Board supports keyboard focus and accessible labels.

### Chess

- Removed the illegal Double Move reward.
- Added a legal Tactical Hint reward.
- Turn timeout makes a legal automatic White move instead of rewriting FEN state.
- Undo validates that a complete turn exists.
- Added four-choice learning questions and complete draw detection.
- Final question statistics are retained when a game ends.

### Checkers

- Fixed the recursive piece-selection crash.
- Players can choose their own multi-jump path.
- Promotion correctly ends a capture chain under American checkers rules.
- Added keyboard-accessible board squares and safer New Game confirmation.

### Scramble

- No repeated Names during an eight-round session.
- Reduced round time to 30 seconds.
- Added Undo, keyboard letter entry, Backspace, and Enter controls.
- Correctly identifies the fastest successful round.

### Name Rush

- Locks input during feedback to prevent double scoring/life loss.
- Prevents visually identical correct and incorrect meanings.
- Uses the learner's local date for daily scores.
- Prevents negative elapsed-time results.

### Divine Descent

- Prevents duplicate miss/answer processing.
- Misses now count in accuracy.
- Calm, Meteor, and Supernova change real gameplay speed.
- Prevents duplicate visible meanings.

### Birds of Paradise

- Uses one pointer event so mobile taps do not flap twice.
- Preserves level progress between visits.
- Missing the final gate no longer awards a free level clear.
- Adds keyboard controls and accessible flight-area labeling.

## Verification

Run from the project folder:

```bash
npm install
npm test
npm run build
```

The completed release passes 18 automated game tests, production compilation, direct-route checks, formatting checks, and a production-dependency security audit.
