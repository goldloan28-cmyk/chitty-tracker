# Daily Chit Tracker — Install on Your Phone

Every file in this folder sits at the top level (no subfolders!) so you
can upload it straight from GitHub's mobile website with zero renaming.

## Files in this folder

```
index.html
main.jsx
App.jsx
manifest.json
sw.js
package.json
vite.config.js
icon-192.png
icon-512.png
README.md
```

## Step 1 — Upload all of these to your GitHub repo

1. On your repo page (use Chrome/Safari with "Desktop site" turned on),
   tap **Add file → Upload files**
2. Tap **"choose your files"** and select ALL files in this folder at
   once (or in 2-3 batches if your phone limits multi-select)
3. Tap **Commit changes**

No renaming needed — everything just lands at the repo root, matching
this folder exactly.

## Step 2 — Deploy on Netlify

1. Go to **netlify.com**, tap **Sign up** → **"Sign up with GitHub"**
2. Tap **"Add new site" → "Import an existing project"**
3. Choose **GitHub**, then select your repo
4. Netlify auto-detects the build command (`npm run build`) and output
   folder (`dist`) — just tap **Deploy**
5. Wait ~1-2 minutes for your live link, e.g.
   `https://chitty-tracker-xyz.netlify.app`

## Step 3 — Install on your phone

Open your live link, then:

**Android (Chrome):** tap **⋮** menu → **"Add to Home screen"**
**iPhone (Safari):** tap **Share** icon → **"Add to Home Screen"**

It now opens full-screen like a real app, works offline, and your data
stays saved on your phone between sessions.

## About your data

Data is stored locally on your phone. It is not automatically backed
up to the cloud — if you lose the phone or clear browser data, it's
gone. Ask Claude to wire this up to Google Sheets for safer storage
if that matters to you.
