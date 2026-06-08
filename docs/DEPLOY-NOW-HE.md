# פריסה מיידית — ARTIST (JUSIC ELITE PRO)

## אופציה א׳ — Blueprint חדש (מומלץ אם אין שירות)

1. פתח: [Render Blueprint — ARTIST](https://render.com/deploy?repo=https://github.com/nisani9792-arch/ARTIST)
2. הוסף משתני סביבה:
   - `DATABASE_URL` — Neon pooled URL (ללא `channel_binding=require`)
   - `GATE_SECRET` — `JUSIC`
   - `GEMINI_API_KEY` — אופציונלי
3. **Apply** — Render יבנה `npm ci && npm run build` ויעלה `npm run start`
4. אחרי העלייה: פתח URL → `JUSIC` → שם מפעיל → `/artists?view=kanban`

## אופציה ב׳ — שירות קיים (Manual Deploy)

1. [dashboard.render.com](https://dashboard.render.com) → `jusic-artist`
2. **Settings → Build & Deploy**
3. **Repository** — ודא: `nisani9792-arch/ARTIST` · branch `main`
4. **Build Command** (בדיוק):
   ```
   npm ci && npm run build
   ```
   אל תשתמש ב-`pm install`!
5. **Start Command**: `npm run start`
6. **Manual Deploy** → Deploy latest commit

## אופציה ג׳ — GitHub Actions

1. Render Dashboard → Service → **Settings** → העתק **Service ID**
2. Render → Account → **API Keys** → צור מפתח
3. GitHub → `nisani9792-arch/ARTIST` → Settings → Secrets:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID`
4. Actions → **Deploy Render** → Run workflow

## בדיקה

```
GET https://YOUR-SERVICE.onrender.com/api/health
```

צפוי: `{"ok":true}`
