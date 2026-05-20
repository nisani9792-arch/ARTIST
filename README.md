# JUSIC ARTIST

מערכת CRM חכמה וקלה לניהול אומנים חתומים, לא חתומים ותקועים.

## מה יש במערכת

- ממשק מלא בעברית ובכיוון RTL.
- דשבורד עם סיכום, קיצורי דרך ו"העבודה שלי".
- כרטיסיות, טבלה ולוח Kanban לניהול סטטוס חתימה.
- חיפוש וסינון בשרת (pagination) — מהיר גם עם אלפי אומנים.
- טיפול מרוכז: שינוי סטטוס וגורם מטפל.
- שמירה אוטומטית ב-Neon PostgreSQL.
- ייצוא CSV (גם בנייד) וגיבוי JSON.
- PWA להתקנה בטלפון בשם JUSIC ARTIST.
- שער גישה לפי IP + שם מפעיל (סיסמה נבדקת בשרver).

## הרצה מקומית

```bash
npm install
npm run db:init
npm run db:seed
npm run dev:server
npm run dev
```

## בנייה לפרודקשן

```bash
npm run build
npm run start
```

## ייבוא נתונים מאקסל

```bash
npm run import:artists
npm run db:seed
```

הסקריפט קורא את קבצי האקסל (ראה `scripts/read-source-artists.cjs`) ומייצר `data/seed/artists.json`.

## משתני סביבה

ראה `.env.example`:

- `DATABASE_URL` — חיבור Neon
- `GATE_SECRET` — סיסמת שער (לא בקוד!)
- `GATE_ALLOW_SHORTCUT` — אפשר רווח×3
- `GATE_ALLOW_BIOMETRIC` — אפשר ביומטרי

## בדיקות

```bash
npm run test
npm run test:e2e
```
