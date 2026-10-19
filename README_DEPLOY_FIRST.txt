# ICT251 Science Fair Projects — phone-friendly deployment bundle

This version serves the frontend and Express API from one Node.js service.

## Deploy on Render
1. Create a GitHub account and a **public** repository named `ict251-science-fair`.
2. Upload the files in this folder to the repository root: `package.json`, `server.js`, `index.html`, `styles.css`, `app.js`.
3. On Render, create **New > Web Service**, connect the repository, set Build Command to `npm install`, Start Command to `npm start`, and choose Free if available.
4. Deploy. The same Render URL hosts the web system and API.
5. Test:
   - GET: `https://YOUR-RENDER-SERVICE.onrender.com/api/projects`
   - POST: same URL with method POST and JSON body
   - PUT: `https://YOUR-RENDER-SERVICE.onrender.com/api/projects/1`
   - DELETE: `https://YOUR-RENDER-SERVICE.onrender.com/api/projects/1`
   - Web system: `https://YOUR-RENDER-SERVICE.onrender.com/`

Important: these are URL formats, not live links until you deploy. Render free services may sleep when idle. SQLite files on ephemeral hosting can be reset on redeploy; use this as a demonstration database, not permanent production storage.
