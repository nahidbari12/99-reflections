# 99 Reflections — Learn Mode 2.0

This package remains a static-first Vite/React site. It can be hosted on GitHub Pages for free, and the included Replit configuration and Express fallback can serve the same production build on Replit.

## What was added

- Personalized Learn Mode dashboard with a guided daily plan
- Unified device-local learner profile
- Per-Name mastery states: New, Learning, Familiar, Mastered, and Needs Review
- Smart Learn sessions in 5, 10, or 15 minute lengths
- Spaced-review scheduling based on Again, Hard, Got it, and Easy feedback
- Progressive question styles: exposure, meaning recognition, and reverse recall
- Mistake tracking from Smart Learn, flashcards, and Daily Quiz
- Full 99 Names mastery map with filters
- Retention, streak, weekly minutes, and overall progress reporting
- Learning-goal and daily-pace settings
- Unlimited flashcard favorites
- Private, device-local reflection journal for every Name
- Golden Letters completion summarized in the new progress experience
- Persistent bottom learning navigation
- GitHub Pages deep-link preservation for direct routes and browser refreshes

## Run in Replit

Upload the ZIP and choose **Run**. The development command is already configured as `npm run dev`.

For a production deployment, Replit can run:

```bash
npm run build
node index.js
```

## GitHub Pages

The existing deployment command is unchanged:

```bash
npm run deploy
```

The `CNAME` and static routing fallback remain included.

## Progress and privacy

Learning progress and private reflections are stored only in that browser's local storage. This keeps the site free, static, and account-free. Cloud sync, family accounts, AI tutoring, recorded human audio, and speaking assessment would require services or content not bundled into this static release.
