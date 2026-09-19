# Couple Site

Interaktiv "couple" uslubidagi telefon uchun mo'ljallangan sayt. Javoblar Telegram botga yuboriladi. Videolar Supabase Storage orqali (Netlify function 6MB limitini chetlab o'tib) yuboriladi.

## Fayllar

- `index.html` — HTML skeleti
- `style.css` — dizayn (faqat telefon uchun mo'ljallangan)
- `app.js` — logika
- `questions.js` — **savol matnlari shu yerda**, faqat shuni tahrirlang
- `netlify/functions/send.js` — Telegramga xabar / rasm / video (URL) yuborish
- `netlify/functions/upload-url.js` — Supabase'ga to'g'ridan-to'g'ri yuklash uchun signed URL beradi
- `netlify.toml` — Netlify sozlamalari
- `package.json` (root) — function'lar uchun ham shu yerdagi dependencies ishlatiladi (`@supabase/supabase-js`, `busboy`). Netlify build paytida root'da `npm install` avtomatik ishlaydi.

## Sozlash

### 1) Telegram bot
1. Telegramda `@BotFather` ga kiring, `/newbot` buyrug'ini yuboring.
2. Bot nomi va username tanlang. `BotFather` sizga token beradi (`TELEGRAM_BOT_TOKEN`).
3. O'zingizga `@userinfobot` orqali `chat_id` ni olib qo'ying (`TELEGRAM_CHAT_ID`).
4. **Botga o'zingiz "/start" bosing** — aks holda bot sizga xabar yubora olmaydi.

### 2) Supabase (video uchun)
1. https://supabase.com da loyiha yarating.
2. Storage → New bucket → nomi **`couple-media`**, **Private** (Public emas).
3. Project Settings → API dan quyidagilarni oling:
   - `SUPABASE_URL` (masalan: `https://xxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` — **service_role** kalit. Bu FAQAT server tomonida (Netlify env variable'da) ishlatiladi, hech qachon frontend'da bo'lmasin.

### 3) Environment variables
Netlify dashboard → Site settings → Environment variables (yoki lokal test uchun `.env` fayl loyiha ildizida):

```
TELEGRAM_BOT_TOKEN=1234567:abcXYZ...
TELEGRAM_CHAT_ID=123456789
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

> `.env` fayl `.gitignore` ichida — GitHub'ga tushmaydi. Fayl nomi aynan `.env` bo'lishi kerak (`.env.txt` emas).

### 4) Lokal test (netlify dev)

```bash
# Netlify CLI o'rnating (bir marta):
npm install -g netlify-cli

# Loyiha dependencylarini o'rnating (root'da bir marta):
npm install

# Ishga tushirish:
netlify dev
```

Brauzerda `http://localhost:8888` ochiladi. Terminalda `[telegram] sendMessage ok` yozuvi chiqsa — hammasi to'g'ri.

### 5) Deploy (Netlify)
1. GitHub repo'ni Netlify'ga ulang.
2. Environment variables'ni sozlang.
3. Deploy tugaganda saytingiz tayyor.

## Video oqimi (qanday ishlaydi)

1. Foydalanuvchi video tanlaydi. Fayl turi (`video/*`) va davomiyligi (≤ 60s) tekshiriladi.
2. Agar hajm > 20MB bo'lsa, brauzerda 720p / ~2.5 Mbps ga siqiladi (MediaRecorder). Audio saqlanadi.
3. `/.netlify/functions/upload-url` service role kalit bilan Supabase Storage'ga **bir martalik signed upload URL** yaratadi.
4. Brauzer to'g'ridan-to'g'ri Supabase'ga PUT qiladi (progress bar bilan).
5. `/.netlify/functions/send` `type: video_from_storage` bilan chaqiriladi. U 1 yillik signed download URL yaratadi va Telegram `sendVideo` ga URL bilan yuboradi. Agar Telegram xato qaytarsa (fayl katta), oddiy xabar bilan link yuboriladi.

## Xavfsizlik
- `SUPABASE_SERVICE_ROLE_KEY` FAQAT function ichida. Frontend'da bo'lmasin.
- Bucket `Private` — faqat signed URL orqali kirish mumkin.
- `.env` git'ga tushmaydi.

## Savollarni tahrirlash
Barcha matnlar `questions.js` faylida.

## Xususiyatlar
- **Ekran 1, 11** — HA/YO'Q, "Yo'q" bosilgan sari kichrayadi
- **Ekran 2** — Variantli tanlov + typewriter effekti
- **Ekran 3–10** — Matn kiritish
- **Ekran 5** — Foydalanuvchi jim turganda "SHU XOLOS? 🤨"
- **Ekran 12** — "Yo'q" button qochib yuradi
- **Ekran 13** — Rasm yuklash (faqat rasm qabul qilinadi, brauzerda siqiladi, function orqali sendPhoto)
- **Ekran 14** — Video yuklash (faqat video, ≤ 1 daqiqa, Supabase orqali)
- **Ekran 15** — Konfetti + typewriter yakuniy matn
