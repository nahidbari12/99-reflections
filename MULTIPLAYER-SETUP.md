# Publish Quiz Battle

GitHub Pages serves the site from the `gh-pages` branch. The separate `99-reflections-multiplayer` Worker serves private rooms over WebSockets and stores rankings in SQLite-backed Durable Objects. These steps use the Cloudflare account you already have and leave Plate's food-search Worker and the site's DNS alone.

## 1. Open the project on your computer

Install Git and Node.js 24 LTS if needed. Open PowerShell in the folder where you want a copy of the project.

```powershell
git clone --branch quiz-battle https://github.com/nahidbari12/99-reflections.git 99-reflections-multiplayer
cd 99-reflections-multiplayer
npm ci
```

If you have the updated project ZIP, you can also extract it and open a terminal at its root. The Git clone gives the Pages publishing command its GitHub remote automatically.

## 2. Deploy the multiplayer Worker

From the project folder, run these commands. Wrangler opens Cloudflare in your browser. Sign in, approve Wrangler, and choose the account where you want the new Worker.

```powershell
cd multiplayer-worker
npx --yes wrangler@4 login
npx --yes wrangler@4 deploy
cd ..
```

Copy the `https://...workers.dev` URL that Wrangler prints. If Wrangler asks you to create a Workers subdomain, choose one in Cloudflare and rerun the deploy command. Open the URL with `/health` appended and check that it reports `ready: true` for `99 Reflections multiplayer`. Deploy from the project folder using Wrangler so it can bundle the existing Names dataset and apply both Durable Object migrations.

## 3. Test with two players before publishing

From the project root, set the Worker URL for Vite. Replace the example URL with your actual Worker URL.

```powershell
Set-Content -Path .env.local -Value 'VITE_MULTIPLAYER_URL=https://99-reflections-multiplayer.YOUR-SUBDOMAIN.workers.dev' -Encoding ascii
npm run dev
```

Open the local URL Vite prints, usually `http://localhost:5000`. On two separate browser profiles, or in a regular and a private window, go to Gamer Mode and open Quiz Battle. Choose two different nicknames. Create a room in one window, follow the invite link in the other, and start the battle. Check that both see identical questions, that answers reveal together, and that live scores update after each reveal. At the end, check the Top 50 and accept a rematch in both windows. Local testing here uses the live Worker and its real leaderboard, so use the usernames you want to keep. Press Ctrl+C in the terminal when finished.

## 4. Publish to the existing GitHub Pages branch

In the cloned project, run these commands in PowerShell. When Git asks you to sign in, use your GitHub account with write access to the repository.

```powershell
npm run build
npm run test:seo
npx gh-pages -d dist -t -b gh-pages
```

The final command includes `.nojekyll` and publishes the generated site and its `CNAME` to the existing `gh-pages` branch. In GitHub, open **Settings → Pages** and confirm the source is **Deploy from a branch**, `gh-pages`, `/(root)`. Check **Actions** for the Pages deployment. After it finishes, open [Quiz Battle](https://99namesofallah.org/gamer-mode/quiz-battle/) and repeat the invite test on two browsers.

Each match has ten questions, 15 seconds per question and one point per correct answer. The global leaderboard shows one best completed score per username, with tied scores ordered alphabetically. Usernames are public and tied to a browser profile. Clearing its storage loses access to that nickname. Test from a separate local Worker with `wrangler dev --port 8787` and `VITE_MULTIPLAYER_URL=http://127.0.0.1:8787` if you want test scores to stay off the production leaderboard.
