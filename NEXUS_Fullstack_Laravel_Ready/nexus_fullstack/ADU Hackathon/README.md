# NEXUS — Family AI Game Day · Experience Edition

**Team 260 / Code NULWO — ADU COE STEM Programming with AI Competition**

A fully redesigned, offline-first family championship web app. This is a complete static front-end build with five playable trials, scoreboard, session timer, event history, instructions, and local JSON reporting.

## Run

1. Extract `NEXUS_Experience_Edition.zip`.
2. Open `ADU Hackathon/index.html` in Chrome, Edge, Safari or Firefox.
3. Select **Enter the arena**, create your teams, and choose any of the five trials.

No Node.js, npm install, account, API key, build tools, internet access, or server required. All scripts, CSS, illustrations and interaction code are local. System fonts are used for offline compatibility.

## What's new

- Completely reimagined sport-editorial visual identity: acid-lime / graphite, giant typography, custom CSS 3D-style globe composition, bespoke asymmetrical trial layouts.
- Cinematic entrance, scroll-reveal effects, gentle pointer-reactive illustration, moving typographic ticker, and slim scroll-progress indicator.
- Accessible **How it works** dialog, navigation shortcuts, native keyboard focus indicators, reduced-motion support, mobile-specific layout.
- Rebuilt styling for player setup, game controls, timer, evidence history and results.
- Fixed memory trial hiding its observation scene once questioning starts.
- Fixed the finale unlock to exclude the finale from its own prerequisites and prevent multiple awards.
- Session events remain local and can be exported as a JSON report.

## Files

- `index.html` — screens, semantic structure, and the NEXUS hero
- `style.css` — original baseline components, retained for behavior compatibility
- `experience.css` — new comprehensive design system and responsive presentation
- `ai-judge.js` — local deterministic rule validation and score summaries
- `app.js` — original gameplay, with targeted logic and UX fixes
- `experience.js` — progressive enhancement: scroll, motion, and cursor interaction

## Accuracy / technical honesty

The app is a real *playable prototype*, not a computer-vision or machine-learning implementation. Football events are referee-confirmed; optional footage remains local and isn't analyzed. Heritage Memory uses predetermined answers; tower height and stability are entered / witnessed by people; Echo Rhythm uses browser event timestamps; final unlocking follows a deterministic rule set. 'VERIFIED' in reports means an event passed local rule checks or came from explicitly user-confirmed data, **not** independent AI verification. No AI model or backend is secretly operating. Do not claim otherwise in a competition presentation.

## Testing

JavaScript syntax checked using `node --check`. Static markup / wiring checks performed. A browser screenshot run was attempted, but headless Chromium could not successfully start in the available execution environment, so rendered UI and full interaction testing in a real browser are **not claimed**. Manually test on your competition device, particularly media permissions, rhythm audio, keyboard navigation and viewport responsiveness.

## Suggested next engineering milestones

- Browser end-to-end automated tests (Playwright), visual regression at multiple viewport widths.
- Explicit review workflow for uncertain events and structured evidence attachments.
- Actual on-device video inference, only after labeling, benchmarking, and accuracy reporting.
- Optional persisted sessions with an explicit new-championship/reset workflow.

## Experience Edition v2 — Gameplay refinements
- Team setup now has live team rosters and validates names, uniqueness, and at least one player per team.
- Team/player pickers in football, building, rhythm, and memory stay in sync, so scoring goes to the selected team. The cooperative finale also has a team selection.
- Results view adds a confirmation-protected reset button. It clears score totals, event logs, timer, and gameplay progress, while retaining team names and player assignments. Export JSON before resetting to keep the current report.
- Hero headline tracking is refined to 3px with responsive typography.
