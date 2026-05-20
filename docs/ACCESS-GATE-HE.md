# הוראות מסך כניסה — JUSIC ARTIST CRM

מסמך זה מתאר איך מיושם מסך הנעילה בפרויקט, כדי שתוכל להעתיק את הלוגיקה לאתרים אחרים.

## עקרון כללי

| שכבה | מה המשתמש רואה | מה באמת קורה |
|------|----------------|--------------|
| **תצוגה** | מנעול + "אנא הכנס סיסמא" + שדה עד 20 תווים | השדה **לא** פותח כלום |
| **מקלדת** | אין רמז על המסך | **רווח × 3** בתוך ~1.6 שניות פותח |
| **ביומטרי** | כפתור זיהוי ביומטרי | WebAuthn — טביעת אצבע / Windows Hello / Face ID |

הפתיחה נשמרת ב-`sessionStorage` — בכל **סשן דפדפן חדש** (טאב/חלון שנסגר) המסך חוזר.

---

## קבצים בפרויקט

```
src/hooks/useUnlockGate.ts      ← רווח × 3
src/hooks/useBiometricUnlock.ts ← טביעת אצבע / Windows Hello
src/components/LockScreen.tsx   ← ממשק המנעול
src/components/LockScreen.css
src/App.tsx                     ← if (!unlocked) return <LockScreen />
```

---

## 1. רווח × 3 (`useUnlockGate.ts`)

```typescript
const STORAGE_KEY = 'artist-crm-unlocked'
const RESET_MS = 1600
const REQUIRED_PRESSES = 3

// בכל keydown:
// - אם Space → מונה +1
// - אם מונה >= 3 → sessionStorage.setItem + setUnlocked(true)
// - אם עברו 1600ms בלי Space → מאפס מונה
```

**שימוש ב-App:**

```tsx
const { unlocked, unlock } = useUnlockGate()

if (!unlocked) {
  return <LockScreen onUnlock={unlock} />
}
```

---

## 2. שדה סיסמה מדומה (`LockScreen.tsx`)

- `maxLength={20}`
- `type="password"`
- `onSubmit` → `preventDefault()` בלבד
- **אין** קישור ל-`unlock()`

---

## 3. זיהוי ביומטרי (`useBiometricUnlock.ts`)

### דרישות

- האתר חייב לרוץ ב-**HTTPS** (או `localhost`)
- דפדפן עם `PublicKeyCredential` (Chrome, Edge, Safari, Firefox מודרני)

### תהליך

1. **בדיקת זמינות** — `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` או fallback ל-`isSecureContext`
2. **רישום (פעם ראשונה)** — `navigator.credentials.create()` עם `authenticatorAttachment: 'platform'`
3. **שמירה** — `localStorage` מפתח `artist-crm-biometric-id` = מזהה ה-credential ב-base64
4. **כניסה** — `navigator.credentials.get()` עם `allowCredentials` + `userVerification: 'required'`
5. בהצלחה → קורא ל-`onSuccess()` (= אותו `unlock` מ-sessionStorage)

### מחשב ונייד

- **Windows** — Windows Hello (טביעה / PIN / פנים)
- **Mac** — Touch ID
- **iPhone/Android** — טביעת אצבע / Face ID

הכפתור מוצג כש-WebAuthn זמין; הטקסט:  
`כניסה ביומטרית (טביעת אצבע / Windows Hello)`

---

## 4. העתקה לפרויקט אחר

### מינימום

1. העתק את `useUnlockGate.ts` ו-`LockScreen` (+ CSS)
2. עטוף את האפליקציה:

```tsx
const { unlocked, unlock } = useUnlockGate()
if (!unlocked) return <LockScreen onUnlock={unlock} />
return <YourApp />
```

3. שנה `STORAGE_KEY` לשם ייחודי לפרויקט

### עם ביומטרי

1. העתק גם `useBiometricUnlock.ts`
2. ב-`LockScreen` העבר `onUnlock` ל-`useBiometricUnlock(onUnlock)`
3. שנה `CREDENTIAL_KEY` ב-localStorage לשם ייחודי
4. ודא פריסה על HTTPS

### התאמות מומלצות

| פרמטר | ערך נוכחי | הערה |
|--------|-----------|------|
| `REQUIRED_PRESSES` | 3 | מספר לחיצות רווח |
| `RESET_MS` | 1600 | חלון זמן בין לחיצות |
| `STORAGE_KEY` | `artist-crm-unlocked` | sessionStorage |
| `CREDENTIAL_KEY` | `artist-crm-biometric-id` | localStorage |

---

## 5. מה לא לעשות

- לא להציג על המסך "לחץ רווח" או מונה לחיצות
- לא לחבר את שדה הסיסמה לפתיחה אמיתית (אלא אם תרצה סיסמה אמיתית בעתיד)
- לא לשמור סיסמה ב-localStorage

---

## 6. איפוס לבדיקות

```javascript
sessionStorage.removeItem('artist-crm-unlocked')
localStorage.removeItem('artist-crm-biometric-id')
```

ואז רענון הדף.
