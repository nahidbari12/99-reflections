# Arabic Layout Fix

- Expanded the Learning Journey Arabic-name column so longer Names remain fully visible.
- Removed an unused 55-pixel grid track that was incorrectly receiving the Arabic Name because the number badge is absolutely positioned.
- Explicitly assigned the Arabic Name, English details, and action button to their intended grid columns.
- Added responsive laptop, tablet, and mobile grid behavior.
- Added Arabic-aware font fallbacks, right-to-left isolation, safe line height, and glyph padding.
- Applied safe Arabic line spacing to Flashcards, the Names grid, and Name Rush.
- Added regression tests for the responsive column and Arabic glyph spacing.
