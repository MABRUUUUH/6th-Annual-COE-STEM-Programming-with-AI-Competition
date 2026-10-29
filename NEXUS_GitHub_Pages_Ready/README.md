# NEXUS — GitHub Pages Edition

**Static, dependency-free web app.** Upload the files in this folder to the **root of your GitHub repository** and enable GitHub Pages. No PHP, Laravel, Composer, Node.js, database, build step, or startup script is required.

## GitHub Pages deployment

1. Create a GitHub repository (public for standard GitHub Pages availability).
2. Upload all files **inside** this folder directly into the repository root (`index.html`, `app.js`, `storage.js`, CSS and supporting scripts). Do not upload an enclosing folder in place of these files.
3. Commit the files.
4. Open **Settings → Pages → Build and deployment**.
5. Select **Deploy from a branch**, `main`, `/ (root)`, then **Save**.
6. Open the Pages URL shown in the settings after deployment.

You can also double-click `index.html` to use the app locally in a browser that permits local storage for `file://` pages. GitHub Pages over HTTPS is recommended for consistent persistence.

## Features

- 2–6 player roster and custom team names.
- Five interactive trials: football, memory, tower building, rhythm, final protocol.
- Browser-side event scoring engine with validation and duplicate-award prevention.
- Persistent scoreboard and evidence history via localStorage (same browser and origin).
- Reset scores and completed trials while keeping teams.
- Export results JSON and import/export complete championship backups.
- Responsive design and source comments.

## Important limitations

**GitHub Pages is static hosting; it cannot execute a backend or hold a shared database.** The lightweight JavaScript game engine is not a secure authoritative backend. Data is saved in each browser's localStorage; different devices do not share a live scoreboard, and users can modify their own local data. To move data between devices, use **Backup championship** and **Restore backup** on the results page. Browser storage can be cleared by the user or by browser privacy policies: export backups when results matter.

Football actions and tower stability require a human referee or witness. Video is selected locally and not uploaded or analyzed by AI. This package does **not** claim AI judging or secure cheating-resistant multi-user play.

If later you need synchronized, authenticated scores across phones, connect a hosted backend such as Supabase/Firebase and replace the adapter in `storage.js`.

## Files

- `index.html` — page markup and application views
- `app.js` — game UI and event handlers
- `storage.js` — lightweight JavaScript data store and validated scoring logic
- `ai-judge.js` — report summary utility
- `style.css`, `experience.css` — responsive design
- `experience.js` — presentation effects
- `.nojekyll` — serves assets directly on GitHub Pages
