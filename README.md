# Couple Site

Interaktiv "couple" uslubidagi telefon uchun mo'ljallangan sayt. Javoblar Telegram botga yuboriladi.

## Fayllar

- `index.html` — HTML skeleti
- `style.css` — dizayn (faqat telefon uchun mo'ljallangan)
- `app.js` — logika
- `questions.js` — **savol matnlari shu yerda**, faqat shuni tahrirlang
- `netlify/functions/send.js` — Telegram bot bilan aloqa
- `netlify.toml` — Netlify sozlamalari

## Sozlash

### 1) Telegram bot yaratish
1. Telegramda `@BotFather` ga kiring, `/newbot` buyrug'ini yuboring.
2. Bot nomi va username tanlang. `BotFather` sizga token beradi (`TELEGRAM_BOT_TOKEN`).
3. O'zingizga `@userinfobot` orqali `chat_id` ni olib qo'ying (`TELEGRAM_CHAT_ID`).

### 2) Environment variables (Netlify)
Netlify dashboard → Site settings → Environment variables ga quyidagilarni qo'shing:

- `TELEGRAM_BOT_TOKEN` — botning tokeni
- `TELEGRAM_CHAT_ID` — sizning chat id'ingiz

### 3) Lokal test (netlify dev)

```bash
# Netlify CLI o'rnating (bir marta):
npm install -g netlify-cli

# Function bog'liqliklarini o'rnating:
cd netlify/functions
npm install
cd ../..

# .env fayl yarating (lokal test uchun, git'ga tushmaydi):
# TELEGRAM_BOT_TOKEN=xxx
# TELEGRAM_CHAT_ID=xxx

# Ishga tushirish:
netlify dev
```

Brauzerda `http://localhost:8888` ochiladi.

### 4) Deploy (Netlify)

1. GitHub repo'ni Netlify'ga ulang.
2. Environment variables'ni sozlang.
3. Deploy tugaganda saytingiz tayyor.

## Savollarni tahrirlash

Barcha matnlar `questions.js` faylida. Kodni tegmasdan faqat shu faylni tahrirlang — savol matnlari, button matnlari, animatsion yozuvlar hammasi shu yerda `"BU YERGA SAVOL YOZING"` kabi placeholder ko'rinishida.

## Xususiyatlar

- **Ekran 1, 11** — HA/YO'Q, "Yo'q" bosilgan sari kichrayadi
- **Ekran 2** — Variantli tanlov + typewriter effekti
- **Ekran 3–10** — Matn kiritish (bo'sh javob qabul qilinmaydi)
- **Ekran 5** — Foydalanuvchi jim turganda "SHU XOLOS? 🤨" chiqadi
- **Ekran 12** — "Yo'q" button qochib yuradi
- **Ekran 13** — Rasm yuklash (brauzerda siqiladi)
- **Ekran 14** — Video yuklash (maks. 4MB)
- **Ekran 15** — Konfetti + typewriter yakuniy matn

## Telegram xabarlar

- Sayt ochilganda: `🔔 Kimdir saytni ochdi`
- Har bir javob darhol yuboriladi
- Rasm va video ham botga tushadi
- Oxirida yakuniy xulosa jo'natiladi
