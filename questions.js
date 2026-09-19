// ============================================================
// BU YAGONA FAYL — hamma savol, button va animatsion yozuvlar
// shu yerda. Kod tegmaydi, faqat quyidagi matnlarni almashtiring.
// ============================================================

// Ekran ochilganda tepada chiqadigan brend/sarlavha
window.SITE_TITLE = "BU YERGA SARLAVHA YOZING"; // masalan: sevgilingizning ismi yoki qisqa titr

// ============================================================
// 15 ta ekran ketma-ketligi
// ============================================================
window.QUESTIONS = [

  // ----- 1-ekran: HA/YO'Q, YO'Q kichrayib boradi -----
  {
    type: "yesno_shrink",
    question: "BU YERGA SAVOL YOZING",       // masalan: "MENI SEVASANMI?"
    yesText: "HA, JUDA HAM",                 // "Ha" button matni
    noText: "YO'Q",                          // "Yo'q" button matni
    shrinkNote: ""                           // bo'sh qoldirilsa hech narsa chiqmaydi
  },

  // ----- 2-ekran: variantli tanlov + typewriter yozuv -----
  {
    type: "choice",
    question: "QANCHALIK?",
    options: ["Ozgina", "O'rtacha", "Ko'p", "Juda ham", "Bor vujudim bilan"],
    // Har qanday variant tanlansa ham pastda shu matn typewriter effekti bilan chiqadi:
    afterText: "BU YERGA JAVOB YOZUVINI YOZING", // masalan: "MEN SENI UNDAN KO'PROQ SEVAMAN 💗"
    nextText: "Keyingi"
  },

  // ----- 3-ekran: matnli javob -----
  {
    type: "text",
    question: "BU YERGA SAVOL YOZING",        // masalan: "MEN SENGA NIMA UCHUN YOQAMAN?"
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 4-ekran: matnli javob -----
  {
    type: "text",
    question: "BU YERGA SAVOL YOZING",        // masalan: "MENDA SENGA NIMA YOQADI?"
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 5-ekran: matn + jim turganda yozuv chiqadi -----
  {
    type: "text_idle",
    question: "MEN HAQIMDA AYNAN NIMALARNI BILASAN?",
    placeholder: "Bu yerga yozing...",
    idleText: "SHU XOLOS? 🤨",                // yozishdan 1.5s to'xtaganda pastda chiqadi
    nextText: "Keyingi"
  },

  // ----- 6-ekran -----
  {
    type: "text",
    question: "SENGA NIMALAR KO'PROQ YOQADI?",
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 7-ekran -----
  {
    type: "text",
    question: "HOBBYING NIMA? NIMALAR QILISHGA QIZIQASAN?",
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 8-ekran -----
  {
    type: "text",
    question: "KIM BILAN BO'LSANG O'ZINGNI YAXSHI HIS QILASAN?",
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 9-ekran -----
  {
    type: "text",
    question: "YOQTIRGAN GULING?",
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 10-ekran -----
  {
    type: "text",
    question: "YOQTIRGAN RANGING?",
    placeholder: "Bu yerga yozing...",
    nextText: "Keyingi"
  },

  // ----- 11-ekran: HA/YO'Q + kichrayadi + eslatma -----
  {
    type: "yesno_shrink",
    question: "BU YERGA SAVOL YOZING",        // masalan: "MENGA HIS QILGAN TUYG'ULARING BORMI?"
    yesText: "HA",
    noText: "YO'Q",
    shrinkNote: "ESLAB KO'R, BALKI BORDIR 🤔" // "Yo'q" bosilganda chiqadi
  },

  // ----- 12-ekran: HA/YO'Q + YO'Q qochadi + gul -----
  {
    type: "yesno_runaway",
    question: "BU YERGA SAVOL YOZING",        // masalan: "MEN BILAN UCHRASHASANMI?"
    yesText: "HA",
    noText: "YO'Q",
    afterYesText: "OZGINA QOLDI 🌸"           // "Ha" bosilgach chiqadi
  },

  // ----- 13-ekran: rasm yuklash -----
  {
    type: "upload_image",
    question: "BU YERGA SAVOL YOZING",        // masalan: "O'ZINGNING ENG YAXSHI RASMINGNI JOYLA"
    hint: "Bosib rasm tanlang",
    nextText: "KEYINGI SAVOL",
    skipText: "YO'Q, RASM JOYLAMAYMAN"
  },

  // ----- 14-ekran: video yuklash -----
  {
    type: "upload_video",
    question: "BU YERGA SAVOL YOZING",        // masalan: "MEN UCHUN QISQA VIDEO YUBOR"
    hint: "Bosib video tanlang (maks. 4MB)",
    nextText: "TUGATISH",
    skipText: "YO'Q, VIDEO HAM JOYLAMAYMAN",
    tooBigText: "Video juda katta, qisqaroq video tanlang",
    uploadingText: "Yuborilyapti..."
  },

  // ----- 15-ekran: yakuniy ekran -----
  {
    type: "final",
    // Typewriter bilan chiqadigan yakuniy matn.
    // Yangi qatorlar uchun \n ishlating.
    finalText: "BU YERGA YAKUNIY MATN YOZING\nMASALAN: SENI SEVAMAN 💗"
  }
];
