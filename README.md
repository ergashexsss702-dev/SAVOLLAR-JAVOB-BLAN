# Savollarni javobi bilan

Maktab o‘quvchilari uchun matematika va algebra fanlaridan test savollari, bosqichma-bosqich yechimlar, test rejimi, matnni ovozli o‘qish (TTS) va xavfsiz boshqaruv tizimiga ega to‘liq funksional ta'lim platformasi.

---

## Asosiy imkoniyatlar

1. **Kirish va Xavfsizlik tizimi (2 bosqichli):**
   - **1-qadam:** Foydalanuvchi to‘liq ism-familiyasi va telefon raqami (O‘zbekiston formati bo‘yicha avtomatik tekshiruv va normalizatsiya).
   - **2-qadam:** Kirish kodi tekshiruvi.
     - Rasmiy narx: 70 000 so‘m.
     - Telegram orqali kod olish: `https://t.me/ergashexsss7o2`.
     - Rivojlanish (demo) kodi: `07080717`.
     - Administrator paroli: `admin_savollar_2026`.
   - Barcha parollar va kodlar faqat serverda HMAC-SHA256 imzoli qisqa muddatli sessiya tokenlari orqali tekshiriladi; mijoz kodi (frontend)da sirlar saqlanmaydi.

2. **Sinflar, Fanlar va Mavzular filtri:**
   - **Sinflar:** 1-sinfdan 11-sinfgacha.
   - **Fanlar:** Matematika (1–11 sinflar), Algebra (6–11 sinflar).
   - **Matematika mavzulari:** Qo‘shish va ayirish, Ko‘paytirish va bo‘lish, Natural sonlar, Kasrlar, O‘nli kasrlar, Foizlar, O‘lchov birliklari, Geometriya, Perimetr va yuza, Matnli masalalar, Koordinatalar.
   - **Algebra mavzulari:** Manfiy sonlar, Bir noma'lumli tenglamalar, Algebraik ifodalar, Darajalar, Ko‘phadlar, Chiziqli funksiyalar, Tengsizliklar, Tenglamalar sistemasi, Kvadrat tenglamalar, Funksiyalar grafigi.

3. **Savollarni Yaratish Dvigateli:**
   - **100% Deterministik Matematik Dvigatel:** Barcha arifmetik, kasr, daraja va tenglamalarning javoblari mustaqil dasturiy formula bilan hisoblab tekshiriladi.
   - **Gemini AI integratsiyasi:** Server orqali `@google/genai` (`gemini-3.8-flash`) modeli yordamida sifatli, strukturalangan JSON savollar generatsiyasi. Agar kalit topilmasa yoki AI xizmati band bo‘lsa, tizim uzluksiz ravishda deterministik matematik dvigatelga o‘tadi.

4. **Bosqichma-bosqich Yechim va Tushuntirishlar:**
   - “Javoblarni ko‘rsatish” va “Javoblarni yashirish” tugmalari.
   - Har bir savol uchun bosqichma-bosqich amallar ketma-ketligi (1. ..., 2. ...) va sodda tushuntirish.

5. **Interaktiv Test Rejimi:**
   - Savollar bo‘ylab navigatsiya, variant tanlash, belgilanmagan savollar hisoblagichi.
   - Server-tomonlama avtoritativ baholash (`/api/tests/submit`).
   - 5 ballik baholash shkalasi (A'lo, Yaxshi, Qoniqarli, Qoniqarsiz), foiz, xatolar tahlili va to‘g‘ri javoblar ko‘rigi.

6. **Ovozli O‘qish (Text-to-Speech):**
   - Brauzerning `SpeechSynthesis` API imkoniyati.
   - Tezlikni boshqarish: Sekin (0.8x), Oddiy (1.0x), Tez (1.25x).
   - "Savolni eshitish", "Javobni eshitish", "Barchasini eshitish" va to‘xtatish boshqaruvi.

7. **8 Tildagi Interfeys:**
   - O‘zbekcha, English, Русский, Türkçe, العربية (RTL qo‘llab-quvvatlash), Français, Deutsch, Español.

8. **Tungi Osmon va Moslashtiriladigan Fon:**
   - Haqiqiy miltillovchi yulduzlar va otiluvchi yulduzlar (shooting stars) animatsiyasi.
   - Qurilmadan fon rasmini yuklash (<4MB tekshiruvi), oldindan ko‘rish, almashtirish, o‘chirish va qayta tiklash.
   - Matn aniq o‘qilishi uchun qoraytirish darajasi slayderi (20% – 95%).

9. **Administrator Paneli (`/api/admin/*`):**
   - Faol sessiyalar va foydalanuvchilar ro‘yxati.
   - Yangi kirish kodlarini yaratish va yoqish/o‘chirish.
   - To‘lov statuslarini boshqarish ("Kutilmoqda", "Tasdiqlangan", "Rad etilgan").
   - Audit va xavfsizlik jurnali.

---

## Loyiha Tuzilmasi

```
├── server.ts                       # Express backend server & Vite dev integratsiyasi
├── src/
│   ├── shared/
│   │   ├── types.ts                # Umumiy TypeScript turlari
│   │   └── topics.ts               # Sinflar va fanlar mavzulari konfiguratsiyasi
│   ├── server/
│   │   ├── db/store.ts             # Faylga asoslangan xavfsiz persistent JSON baza
│   │   └── services/
│   │       ├── authService.ts      # HMAC-SHA256 sessiya va kod tekshiruvi, limitlar
│   │       ├── mathEngine.ts       # 100% aniq matematik hisoblash dvigateli
│   │       └── geminiService.ts    # @google/genai server integratsiyasi & fallback
│   ├── client/
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Asosiy menyu, til, mavzu, fon boshqaruvi
│   │   │   ├── StarrySky.tsx       # Tungi osmon va otiluvchi yulduzlar (Canvas)
│   │   │   ├── QuestionCard.tsx    # Savol kartasi, variantlar, yechim, TTS
│   │   │   ├── TTSPlayer.tsx       # Ovozli o'qish boshqaruv paneli
│   │   │   ├── TestModeModal.tsx   # Interaktiv test o'tkazish va baholash
│   │   │   ├── AdminModal.tsx      # Administrator boshqaruv paneli
│   │   │   └── BackgroundModal.tsx # Fon rasmini yuklash va kontrast sozlamalari
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # Avtorizatsiya holati
│   │   │   ├── ThemeContext.tsx    # Mavzu va fon holati
│   │   │   └── LanguageContext.tsx # Ko'p tillilik holati
│   │   ├── i18n/
│   │   │   └── translations.ts     # 8 tildagi tarjimalar lug'ati
│   │   └── pages/
│   │       ├── LoginPage.tsx       # 2 bosqichli kirish sahifasi
│   │       └── DashboardPage.tsx   # Asosiy boshqaruv paneli
│   ├── App.tsx                     # Ilova asosiy konteyneri
│   ├── main.tsx                    # React kirish nuqtasi
│   └── index.css                   # Tailwind CSS va print/PDF qoidalari
├── tests/
│   └── suite.ts                    # Avtomatlashtirilgan backend testlar to'plami
├── package.json
└── tsconfig.json
```

---

## Ishga Tushirish Buyruqlari

### 1. Mahalliy ishlab chiqish (Development)
```bash
npm run dev
```
Dev server `http://localhost:3000` portida ishga tushadi.

### 2. Avtomatlashtirilgan testlarni ishga tushirish
```bash
npm test
```

### 3. TypeScript tekshiruvi (Lint)
```bash
npm run lint
```

### 4. Ishlab chiqarish (Production build & start)
```bash
npm run build
npm run start
```

---

## Muhit o‘zgaruvchilari (`.env.example`)

- `PORT=3000`
- `NODE_ENV=development`
- `GEMINI_API_KEY`: Google Gemini API kaliti (ixtiyoriy, agar berilmasa deterministik matematik dvigatel ishlaydi).
- `SESSION_SECRET`: Sessiya tokenlarini imzolash uchun maxfiy kalit.
- `ALLOW_DEMO_CODE=true`: Rivojlanishda `07080717` demo kodini ruxsat berish (productionda `false` qilinadi).
- `ADMIN_KEY="admin_savollar_2026"`: Administrator boshqaruv paneliga kirish paroli.
