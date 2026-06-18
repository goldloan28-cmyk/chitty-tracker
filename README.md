# Daily Chit Tracker — Install on Your Phone

This is your chit fund collection app, packaged so it can be installed
like a real app on your phone (Android or iPhone), with offline support.

## Step 1 — Deploy it (free, ~2 minutes)

You don't need to know how to code. Pick ONE option:

### Option A: Netlify Drop (easiest)
1. Go to **https://app.netlify.com/drop**
2. First run these commands on your computer (needs Node.js installed —
   download from nodejs.org if you don't have it):
   ```
   npm install
   npm run build
   ```
3. This creates a `dist` folder. Drag that `dist` folder onto the
   Netlify Drop page in your browser.
4. Netlify gives you a live link like `https://chitty-tracker-123.netlify.app`

### Option B: Vercel
1. Go to **https://vercel.com**, sign up free, click "Add New Project"
2. Upload this whole folder (or connect it to GitHub if you use that)
3. Vercel auto-detects Vite and builds it. You get a live link.

### Option C: Ask a developer friend
Just hand them this folder — they'll know what to do with `npm install`
and `npm run build`, and can deploy in minutes.

## Step 2 — Install it on your phone

Once you have your live link (e.g. `https://your-app.netlify.app`):

**On Android (Chrome):**
1. Open the link in Chrome
2. Tap the **⋮** menu → **"Add to Home screen"** / **"Install app"**
3. It now appears as an app icon on your home screen — opens full
   screen, no browser bar, works offline.

**On iPhone (Safari):**
1. Open the link in Safari (must be Safari, not Chrome)
2. Tap the **Share** icon (square with arrow) → **"Add to Home Screen"**
3. It now appears as an app icon, opens full screen.

## About your data

Your data is stored locally on your phone (localStorage), so it
survives between app opens and even works with no internet. It is
**not** automatically backed up to the cloud — if you lose the phone
or clear browser data, the data is gone.

For safer storage, ask Claude to help you connect this to Google
Sheets or a proper cloud database — that way your data is backed up
and accessible from multiple devices.

## What's inside this folder

```
chitty-pwa/
├── index.html          ← entry page
├── package.json        ← dependencies
├── vite.config.js       ← build + PWA settings (manifest, offline cache)
├── src/
│   ├── main.jsx         ← React entry point
│   └── App.jsx          ← your actual app (all the features you built)
└── public/
    ├── icon-192.png      ← app icon (small)
    └── icon-512.png      ← app icon (large)
```

## Updating the app later

If you ask Claude to add new features, you'll get an updated `App.jsx`.
Just replace `src/App.jsx` in this folder with the new version, then
repeat Step 1 (rebuild + redeploy).
