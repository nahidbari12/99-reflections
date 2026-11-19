# 99 Reflections Engagement Release

## Lantern Match

- Added a tenth learning game with Easy, Medium, Hard, and audio-based Master levels.
- Added deterministic Daily Boards, daily completion streaks, fresh practice boards, hints, scoring, personal bests, and shareable results.
- Completed pairs now update the unified Learn Mode mastery profile; Names that required a mismatch or hint are recorded as needing more practice.
- Added responsive layouts, keyboard/screen-reader-friendly controls, reduced-motion support, game analytics, and sitemap discovery.

## Homepage and global music controls

- Promoted “Explore all learning modes” from a low-visibility text link to a full secondary button.
- Added collapsible Play/Mute controls across every route, including a compact music pill and a saved display preference.
- Added accessible labels, mobile sizing, safe-area positioning, and a non-blocking audio error message.

This static-site release adds:

- 99 searchable Name pages at `/names/:slug`
- eight themed learning collections at `/themes`
- a deterministic ten-question Daily Challenge at `/daily-challenge`
- shareable Daily Challenge results
- weekly learning recaps and private calendar reminders
- installable/offline PWA support
- next-step recommendations across learning and game completion screens
- complete React route page-view tracking and outcome events
- build-time SEO pages, metadata, structured data, and sitemap generation

## Replit

1. Upload and extract the ZIP.
2. Run `npm install`.
3. Run `npm run dev` for preview.
4. Run `npm test` and `npm run build` before deployment.

## GitHub Pages

Run `npm run deploy`. The production build automatically creates all 99 static Name pages and the sitemap.

## Analytics events

- `page_view`
- `home_action`
- `learning_session_start`
- `learning_session_complete`
- `daily_quiz_complete`
- `challenge_start`
- `challenge_answer`
- `challenge_complete`
- `game_complete`
- `next_step_selected`
- `reminder_download`
- `share`

Measure lesson-start rate, completion rate, next-step clicks, Daily Challenge shares, and seven-day return behavior alongside average engagement time.
