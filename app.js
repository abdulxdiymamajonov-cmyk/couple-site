// =========================================================
// Couple site — asosiy logika
// =========================================================
(function () {
  "use strict";

  const questions = window.QUESTIONS || [];
  const SITE_TITLE = window.SITE_TITLE || "♡";
  const stage = document.getElementById("stage");
  const progressBar = document.getElementById("progressBar");
  const toastEl = document.getElementById("toast");
  const heartsBox = document.getElementById("hearts");
  const brand = document.getElementById("brand");
  const confettiCanvas = document.getElementById("confetti");

  if (SITE_TITLE && SITE_TITLE.trim() && SITE_TITLE !== "BU YERGA SARLAVHA YOZING") {
    brand.textContent = SITE_TITLE;
  }

  const sessionId = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const answers = []; // {q, a}
  let currentIndex = 0;

  // ---------- Fon: suzib yuruvchi yuraklar ----------
  function spawnHearts() {
    const emojis = ["♡", "❤", "❤", "♡", "❤"];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      s.style.left = Math.random() * 100 + "%";
      s.style.fontSize = (16 + Math.random() * 22) + "px";
      s.style.animationDuration = (10 + Math.random() * 12) + "s";
      s.style.animationDelay = (Math.random() * 12) + "s";
      s.style.opacity = (0.25 + Math.random() * 0.35).toFixed(2);
      heartsBox.appendChild(s);
    }
  }
  spawnHearts();

  // ---------- Progress ----------
  function updateProgress() {
    const p = ((currentIndex) / questions.length) * 100;
    progressBar.style.width = Math.min(100, p) + "%";
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms || 2500);
  }

  // ---------- Telegram send ----------
  async function sendJSON(payload) {
    try {
      const res = await fetch("/.netlify/functions/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ sessionId }, payload))
      });
      return await res.json().catch(() => ({}));
    } catch (err) {
      console.warn("send err", err);
      return { ok: false };
    }
  }

  async function sendMedia(kind, fileOrBlob, questionText, filename) {
    try {
      const fd = new FormData();
      fd.append("sessionId", sessionId);
      fd.append("kind", kind); // "photo" | "video"
      fd.append("question", questionText || "");
      fd.append("file", fileOrBlob, filename || "upload");
      const res = await fetch("/.netlify/functions/send", { method: "POST", body: fd });
      return await res.json().catch(() => ({}));
    } catch (err) {
      console.warn("sendMedia err", err);
      return { ok: false };
    }
  }

  function reportAnswer(question, answer) {
    answers.push({ q: question, a: answer });
    sendJSON({ type: "answer", question, answer });
  }

  // Sayt ochilgani
  sendJSON({ type: "visit" });

  // ---------- Ekran o'tish ----------
  function showScreen(builder) {
    // eski ekran ketmoqda
    const prev = stage.querySelector(".screen.active");
    if (prev) {
      prev.classList.remove("active");
      prev.classList.add("leaving");
      setTimeout(() => prev.remove(), 500);
    }
    const screen = document.createElement("section");
    screen.className = "screen";
    stage.appendChild(screen);
    builder(screen);
    // ochish animatsiyasi
    requestAnimationFrame(() => {
      requestAnimationFrame(() => screen.classList.add("active"));
    });
  }

  function nextQuestion() {
    currentIndex++;
    updateProgress();
    render();
  }

  // =========================================================
  // Ekran turlari
  // =========================================================

  function renderYesNoShrink(q) {
    showScreen((s) => {
      const title = document.createElement("h2");
      title.className = "question";
      title.textContent = q.question || "";
      s.appendChild(title);

      const note = document.createElement("div");
      note.className = "shrink-note";
      note.textContent = q.shrinkNote || "";
      s.appendChild(note);

      const actions = document.createElement("div");
      actions.className = "actions";

      const yesBtn = document.createElement("button");
      yesBtn.type = "button";
      yesBtn.className = "btn btn--yes";
      yesBtn.textContent = q.yesText || "HA";

      const noBtn = document.createElement("button");
      noBtn.type = "button";
      noBtn.className = "btn btn--no";
      noBtn.textContent = q.noText || "YO'Q";

      let noScale = 1;
      let noClicks = 0;

      function safeVibrate(ms) {
        try { if (navigator && typeof navigator.vibrate === "function") navigator.vibrate(ms); } catch (e) {}
      }

      noBtn.addEventListener("click", () => {
        noClicks++;
        noScale *= 0.85;
        noBtn.style.transform = `scale(${noScale})`;

        // "Ha" — o'lchami o'zgarmasin, faqat shake
        yesBtn.classList.remove("btn--shake");
        // reflow — animatsiya qaytadan yugurishi uchun
        void yesBtn.offsetWidth;
        yesBtn.classList.add("btn--shake");
        safeVibrate(200);

        if (q.shrinkNote) note.classList.add("show");
        if (noClicks >= 6 || noScale < 0.15) {
          noBtn.style.transition = "opacity 0.4s ease, transform 0.4s ease";
          noBtn.style.opacity = "0";
          noBtn.style.pointerEvents = "none";
          setTimeout(() => noBtn.remove(), 400);
        }
      });

      yesBtn.addEventListener("click", () => {
        reportAnswer(q.question, `${q.yesText || "HA"} (Yo'q ${noClicks} marta bosildi)`);
        nextQuestion();
      });

      actions.appendChild(yesBtn);
      actions.appendChild(noBtn);
      s.appendChild(actions);
    });
  }

  function typewrite(el, text, speed) {
    speed = speed || 55;
    el.textContent = "";
    const caret = document.createElement("span");
    caret.className = "caret";
    let i = 0;
    return new Promise((resolve) => {
      const tick = () => {
        if (i < text.length) {
          el.textContent = text.slice(0, i + 1);
          el.appendChild(caret);
          i++;
          setTimeout(tick, speed);
        } else {
          setTimeout(() => { if (caret.parentNode) caret.remove(); resolve(); }, 400);
        }
      };
      tick();
    });
  }

  function renderChoice(q) {
    showScreen((s) => {
      const title = document.createElement("h2");
      title.className = "question";
      title.textContent = q.question || "";
      s.appendChild(title);

      const choices = document.createElement("div");
      choices.className = "choices";
      s.appendChild(choices);

      const tw = document.createElement("div");
      tw.className = "typewriter";
      s.appendChild(tw);

      const actions = document.createElement("div");
      actions.className = "actions";
      s.appendChild(actions);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "btn";
      nextBtn.textContent = q.nextText || "Keyingi";
      nextBtn.style.display = "none";
      nextBtn.addEventListener("click", () => nextQuestion());

      let picked = null;

      (q.options || []).forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.textContent = opt;
        btn.addEventListener("click", async () => {
          if (picked === opt) return;
          picked = opt;
          choices.querySelectorAll(".choice").forEach((c) => c.classList.remove("selected"));
          btn.classList.add("selected");
          reportAnswer(q.question, opt);
          await typewrite(tw, q.afterText || "");
          burstMiniHearts(s);
          nextBtn.style.display = "block";
          actions.appendChild(nextBtn);
        });
        choices.appendChild(btn);
      });
    });
  }

  function burstMiniHearts(parent) {
    for (let i = 0; i < 10; i++) {
      const h = document.createElement("span");
      h.textContent = "❤";
      h.style.position = "absolute";
      h.style.left = (30 + Math.random() * 40) + "%";
      h.style.bottom = "20%";
      h.style.color = "#fff";
      h.style.fontSize = (16 + Math.random() * 14) + "px";
      h.style.pointerEvents = "none";
      h.style.opacity = "0.9";
      h.style.transition = "transform 1.2s ease, opacity 1.2s ease";
      parent.appendChild(h);
      requestAnimationFrame(() => {
        h.style.transform = `translate(${(Math.random()*160-80)}px, ${-80 - Math.random()*100}px) scale(${1 + Math.random()})`;
        h.style.opacity = "0";
      });
      setTimeout(() => h.remove(), 1300);
    }
  }

  function renderText(q, opts) {
    opts = opts || {};
    showScreen((s) => {
      const title = document.createElement("h2");
      title.className = "question";
      title.textContent = q.question || "";
      s.appendChild(title);

      const ta = document.createElement("textarea");
      ta.className = "field";
      ta.placeholder = q.placeholder || "Bu yerga yozing...";
      ta.autocomplete = "off";
      ta.autocapitalize = "sentences";
      s.appendChild(ta);

      let idleNote = null;
      let idleTimer = null;
      if (opts.idle) {
        idleNote = document.createElement("div");
        idleNote.className = "idle-note";
        idleNote.textContent = q.idleText || "";
        s.appendChild(idleNote);

        const kick = () => {
          if (idleNote) idleNote.classList.remove("show");
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            if (idleNote && ta.value.length > 0) idleNote.classList.add("show");
          }, 1500);
        };
        ta.addEventListener("input", kick);
      }

      const actions = document.createElement("div");
      actions.className = "actions";
      s.appendChild(actions);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "btn";
      nextBtn.textContent = q.nextText || "Keyingi";
      nextBtn.addEventListener("click", () => {
        const val = ta.value.trim();
        if (!val) {
          toast("Iltimos, javob yozing");
          ta.focus();
          return;
        }
        if (idleTimer) clearTimeout(idleTimer);
        reportAnswer(q.question, val);
        nextQuestion();
      });
      actions.appendChild(nextBtn);

      // fokuslash biroz kechiktirilsin (animatsiya tugasin)
      setTimeout(() => { try { ta.focus(); } catch(e){} }, 600);
    });
  }

  function renderYesNoRunaway(q) {
    showScreen((s) => {
      const title = document.createElement("h2");
      title.className = "question";
      title.textContent = q.question || "";
      s.appendChild(title);

      const arena = document.createElement("div");
      arena.className = "runaway-stage";
      s.appendChild(arena);

      const yesBtn = document.createElement("button");
      yesBtn.type = "button";
      yesBtn.className = "btn btn--yes btn--yes-anchor";
      yesBtn.textContent = q.yesText || "HA";
      arena.appendChild(yesBtn);

      const noBtn = document.createElement("button");
      noBtn.type = "button";
      noBtn.className = "btn btn--no btn--runaway";
      noBtn.textContent = q.noText || "YO'Q";
      arena.appendChild(noBtn);

      // "Ha" atrofida SAFE_PAD px zona bo'sh qolsin
      const SAFE_PAD = 40;

      function positionNoRandom() {
        const arenaRect = arena.getBoundingClientRect();
        const w = noBtn.offsetWidth || 130;
        const h = noBtn.offsetHeight || 60;
        const yesRect = yesBtn.getBoundingClientRect();
        // "Ha" ning arena ichidagi koordinatasi
        const yLeft   = yesRect.left - arenaRect.left - SAFE_PAD;
        const yRight  = yesRect.right - arenaRect.left + SAFE_PAD;
        const yTop    = yesRect.top - arenaRect.top - SAFE_PAD;
        const yBottom = yesRect.bottom - arenaRect.top + SAFE_PAD;

        const maxLeft = Math.max(0, arenaRect.width - w - 4);
        const maxTop  = Math.max(0, arenaRect.height - h - 4);

        for (let tries = 0; tries < 50; tries++) {
          const left = Math.random() * maxLeft;
          const top  = Math.random() * maxTop;
          const nx1 = left, ny1 = top, nx2 = left + w, ny2 = top + h;
          const overlap = !(nx2 < yLeft || nx1 > yRight || ny2 < yTop || ny1 > yBottom);
          if (!overlap) {
            noBtn.style.left = left + "px";
            noBtn.style.top = top + "px";
            return;
          }
        }
        // Fallback: yuqori burchak (Ha esa markazda, shuning uchun burchak xavfsiz)
        noBtn.style.left = "4px";
        noBtn.style.top  = "4px";
      }

      setTimeout(positionNoRandom, 100);
      window.addEventListener("resize", positionNoRandom);

      let runCount = 0;
      let lastRun = 0;
      function runAway(ev) {
        // Ko'p hodisalar bir-birining ustidan chiqmasin
        const now = Date.now();
        if (now - lastRun < 60) return;
        lastRun = now;
        if (ev && ev.cancelable) ev.preventDefault();
        runCount++;
        positionNoRandom();
      }
      // FAQAT "Yo'q" elementiga bog'lanadi — konteynerga yoki document'ga emas
      noBtn.addEventListener("mouseenter", runAway);
      noBtn.addEventListener("pointerenter", runAway);
      noBtn.addEventListener("focus", runAway);
      noBtn.addEventListener("touchstart", runAway, { passive: false });
      noBtn.addEventListener("click", (e) => { e.preventDefault(); runAway(e); });

      const flower = document.createElement("div");
      flower.className = "flower-wrap";
      flower.innerHTML = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path d="M100 190 C 100 150, 100 130, 100 110" stroke="#3aa155" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M100 150 C 80 145, 65 140, 55 125" stroke="#3aa155" stroke-width="5" fill="none" stroke-linecap="round"/>
            <ellipse cx="52" cy="120" rx="16" ry="9" fill="#4bb968" transform="rotate(-25 52 120)"/>
            <path d="M100 155 C 120 150, 135 145, 145 130" stroke="#3aa155" stroke-width="5" fill="none" stroke-linecap="round"/>
            <ellipse cx="148" cy="125" rx="16" ry="9" fill="#4bb968" transform="rotate(25 148 125)"/>
            <g transform="translate(100 80)">
              <ellipse cx="0" cy="-30" rx="18" ry="26" fill="#ff6fa8"/>
              <ellipse cx="28" cy="-8" rx="26" ry="18" fill="#ff6fa8"/>
              <ellipse cx="18" cy="24" rx="20" ry="26" fill="#ff87b6"/>
              <ellipse cx="-18" cy="24" rx="20" ry="26" fill="#ff87b6"/>
              <ellipse cx="-28" cy="-8" rx="26" ry="18" fill="#ff6fa8"/>
              <circle cx="0" cy="0" r="14" fill="#ffde66"/>
              <circle cx="0" cy="0" r="8" fill="#ffb31a"/>
            </g>
          </g>
        </svg>
        <div class="flower-text">${q.afterYesText || ""}</div>
      `;
      arena.appendChild(flower);

      yesBtn.addEventListener("click", () => {
        reportAnswer(q.question, `${q.yesText || "HA"} (Yo'q ${runCount} marta qochdi)`);
        noBtn.style.display = "none";
        yesBtn.style.display = "none";
        flower.classList.add("show");
        burstMiniHearts(s);
        setTimeout(nextQuestion, 3000);
      });
    });
  }

  // Rasm siqish
  function compressImage(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxSize || h > maxSize) {
          if (w >= h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error("compress failed"));
          resolve(blob);
        }, "image/jpeg", quality || 0.8);
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  function renderUploadImage(q) {
    showScreen((s) => {
      const title = document.createElement("h2");
      title.className = "question question--sm";
      title.textContent = q.question || "";
      s.appendChild(title);

      const zone = document.createElement("label");
      zone.className = "upload";
      zone.innerHTML = `
        <div class="upload__icon">📷</div>
        <div class="upload__hint">${q.hint || "Bosib rasm tanlang"}</div>
        <div class="upload__preview"></div>
        <input type="file" accept="image/*" />
      `;
      s.appendChild(zone);

      const input = zone.querySelector("input");
      const preview = zone.querySelector(".upload__preview");
      const iconEl = zone.querySelector(".upload__icon");
      const hintEl = zone.querySelector(".upload__hint");
      let chosenBlob = null;

      const actions = document.createElement("div");
      actions.className = "actions";
      s.appendChild(actions);

      const loader = document.createElement("div");
      loader.className = "loader";
      loader.style.display = "none";
      loader.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span><span>Yuborilyapti...</span>`;
      actions.appendChild(loader);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "btn";
      nextBtn.textContent = q.nextText || "KEYINGI SAVOL";
      nextBtn.disabled = true;
      actions.appendChild(nextBtn);

      const skipBtn = document.createElement("button");
      skipBtn.type = "button";
      skipBtn.className = "btn btn--ghost";
      skipBtn.textContent = q.skipText || "YO'Q, RASM JOYLAMAYMAN";
      actions.appendChild(skipBtn);

      input.addEventListener("change", async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (!f.type || !f.type.startsWith("image/")) {
          toast("Bu yerga faqat rasm yuklang", 3500);
          input.value = "";
          return;
        }
        try {
          const blob = await compressImage(f, 1600, 0.8);
          chosenBlob = blob;
          preview.innerHTML = "";
          const img = document.createElement("img");
          img.src = URL.createObjectURL(blob);
          preview.appendChild(img);
          preview.classList.add("show");
          iconEl.style.display = "none";
          hintEl.style.display = "none";
          nextBtn.disabled = false;
        } catch (err) {
          toast("Rasmni o'qib bo'lmadi");
        }
      });

      nextBtn.addEventListener("click", async () => {
        if (!chosenBlob) return;
        loader.style.display = "flex";
        nextBtn.disabled = true;
        skipBtn.disabled = true;
        let res = null;
        try {
          res = await sendMedia("photo", chosenBlob, q.question || "", "photo.jpg");
        } catch (e) { res = null; }
        loader.style.display = "none";
        if (res && res.ok === true) {
          answers.push({ q: q.question, a: "[rasm yuborildi]" });
          nextQuestion();
        } else {
          const desc = (res && res.tg && (res.tg.description || res.tg.error)) || (res && res.error) || "nomalum xato";
          toast("Yuklashda xatolik, qayta urinib ko'ring. (" + desc + ")", 4200);
          nextBtn.disabled = false;
          skipBtn.disabled = false;
          nextBtn.textContent = "QAYTA YUBORISH";
        }
      });

      skipBtn.addEventListener("click", () => {
        reportAnswer(q.question, "Rasm joylamadi");
        nextQuestion();
      });
    });
  }

  // Video metadata olish
  function loadVideoMeta(file) {
    return new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.playsInline = true;
      const url = URL.createObjectURL(file);
      v.onloadedmetadata = () => {
        const info = {
          duration: v.duration,
          width: v.videoWidth,
          height: v.videoHeight,
          url
        };
        resolve(info);
      };
      v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("video metadata error")); };
      v.src = url;
    });
  }

  function mediaRecorderSupported() {
    try {
      if (typeof MediaRecorder === "undefined") return false;
      const canvas = document.createElement("canvas");
      if (typeof canvas.captureStream !== "function") return false;
      const types = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"];
      return types.some((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    } catch (e) { return false; }
  }

  function pickRecorderMime() {
    const types = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "video/webm";
  }

  // 720p ga kichraytirib qayta kodlash. Audio saqlanadi.
  function compressVideo(file, onProgress) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = false;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.onerror = () => { URL.revokeObjectURL(video.src); reject(new Error("video yuklab bo'lmadi")); };
      video.onloadedmetadata = async () => {
        try {
          const maxDim = 720;
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 480;
          if (w > maxDim || h > maxDim) {
            if (w >= h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          const canvasStream = canvas.captureStream(30);

          let combined = canvasStream;
          try {
            const src = video.captureStream ? video.captureStream()
              : (video.mozCaptureStream ? video.mozCaptureStream() : null);
            if (src) {
              const audio = src.getAudioTracks();
              if (audio && audio.length) {
                combined = new MediaStream([...canvasStream.getVideoTracks(), audio[0]]);
              }
            }
          } catch (e) { /* audio ilinmasa ham davom */ }

          const mimeType = pickRecorderMime();
          const recorder = new MediaRecorder(combined, {
            mimeType,
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000
          });
          const chunks = [];
          let stopped = false;
          recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          recorder.onstop = () => {
            if (stopped) return;
            stopped = true;
            URL.revokeObjectURL(video.src);
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
          };
          recorder.onerror = (e) => reject(e.error || new Error("recorder xatosi"));

          video.currentTime = 0;
          try { await video.play(); } catch (e) { /* iOS avtoplay */ }
          recorder.start(500);

          const draw = () => {
            if (video.ended || video.paused) return;
            try { ctx.drawImage(video, 0, 0, w, h); } catch (e) {}
            if (onProgress && video.duration) onProgress(Math.min(1, video.currentTime / video.duration));
            requestAnimationFrame(draw);
          };
          requestAnimationFrame(draw);

          video.onended = () => {
            if (onProgress) onProgress(1);
            setTimeout(() => { try { recorder.stop(); } catch (e) {} }, 250);
          };
        } catch (err) { reject(err); }
      };
    });
  }

  // Signed upload URL orqali to'g'ridan-to'g'ri Supabase'ga PUT
  function uploadToSignedUrl(signedUrl, blob, contentType, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", contentType || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "true");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("upload xatosi: " + xhr.status + " " + xhr.responseText.slice(0, 200)));
      };
      xhr.onerror = () => reject(new Error("tarmoq xatosi"));
      xhr.send(blob);
    });
  }

  async function getSignedUploadUrl(filename, mime) {
    const res = await fetch("/.netlify/functions/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, mime })
    });
    const j = await res.json();
    if (!j || !j.ok) throw new Error((j && j.error) || "signed url olinmadi");
    return j; // {ok, path, signedUrl, token, bucket}
  }

  async function notifyVideoUploaded(path, questionText) {
    const res = await fetch("/.netlify/functions/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "video_from_storage", path, question: questionText, sessionId })
    });
    return await res.json().catch(() => ({}));
  }

  function renderUploadVideo(q) {
    showScreen((s) => {
      const title = document.createElement("h2");
      title.className = "question question--sm";
      title.textContent = q.question || "";
      s.appendChild(title);

      const zone = document.createElement("label");
      zone.className = "upload";
      zone.innerHTML = `
        <div class="upload__icon">🎬</div>
        <div class="upload__hint">${q.hint || "Bosib video tanlang (maks. 1 daqiqa)"}</div>
        <div class="upload__preview"></div>
        <input type="file" accept="video/*" />
      `;
      s.appendChild(zone);

      const input = zone.querySelector("input");
      const preview = zone.querySelector(".upload__preview");
      const iconEl = zone.querySelector(".upload__icon");
      const hintEl = zone.querySelector(".upload__hint");
      let chosenFile = null;

      const actions = document.createElement("div");
      actions.className = "actions";
      s.appendChild(actions);

      const progressWrap = document.createElement("div");
      progressWrap.className = "upload__progress";
      progressWrap.innerHTML = `<div class="upload__progress__bar"></div>`;
      actions.appendChild(progressWrap);

      const status = document.createElement("div");
      status.className = "upload__status";
      actions.appendChild(status);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "btn";
      nextBtn.textContent = q.nextText || "TUGATISH";
      nextBtn.disabled = true;
      actions.appendChild(nextBtn);

      const skipBtn = document.createElement("button");
      skipBtn.type = "button";
      skipBtn.className = "btn btn--ghost";
      skipBtn.textContent = q.skipText || "YO'Q, VIDEO HAM JOYLAMAYMAN";
      actions.appendChild(skipBtn);

      const progressBarEl = progressWrap.querySelector(".upload__progress__bar");
      function setProgress(label, fraction) {
        if (label) status.textContent = label;
        if (typeof fraction === "number") {
          progressWrap.classList.add("show");
          progressBarEl.style.width = Math.max(0, Math.min(100, fraction * 100)).toFixed(1) + "%";
        }
      }
      function clearProgress() {
        progressWrap.classList.remove("show");
        status.textContent = "";
        progressBarEl.style.width = "0%";
      }

      input.addEventListener("change", async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        if (!f.type || !f.type.startsWith("video/")) {
          toast("Bu yerga faqat video yuklang", 3500);
          input.value = "";
          return;
        }
        // Katta hajm cheklovi
        if (f.size > 200 * 1024 * 1024) {
          toast("Video juda katta (200MB dan oshgan)", 3500);
          input.value = "";
          return;
        }
        try {
          const meta = await loadVideoMeta(f);
          if (meta.duration && meta.duration > 60.5) {
            toast("Video 1 daqiqadan oshmasin", 3500);
            input.value = "";
            URL.revokeObjectURL(meta.url);
            return;
          }
          chosenFile = f;
          preview.innerHTML = "";
          const v = document.createElement("video");
          v.src = meta.url;
          v.controls = true;
          v.playsInline = true;
          v.muted = true;
          preview.appendChild(v);
          preview.classList.add("show");
          iconEl.style.display = "none";
          hintEl.style.display = "none";
          nextBtn.disabled = false;
          clearProgress();
        } catch (err) {
          toast("Videoni o'qib bo'lmadi");
        }
      });

      nextBtn.addEventListener("click", async () => {
        if (!chosenFile) return;
        nextBtn.disabled = true;
        skipBtn.disabled = true;
        input.disabled = true;

        let toUpload = chosenFile;
        let uploadType = chosenFile.type || "video/mp4";
        let uploadName = chosenFile.name || "video.mp4";

        try {
          // 20MB dan katta bo'lsa siqishga urinamiz
          if (chosenFile.size > 20 * 1024 * 1024) {
            if (mediaRecorderSupported()) {
              setProgress("Video tayyorlanmoqda...", 0);
              try {
                const compressed = await compressVideo(chosenFile, (frac) => {
                  setProgress("Video tayyorlanmoqda...", frac);
                });
                toUpload = compressed;
                uploadType = compressed.type || "video/webm";
                uploadName = (chosenFile.name || "video").replace(/\.[^.]+$/, "") + ".webm";
              } catch (e) {
                console.warn("compress err", e);
                // Siqib bo'lmasa original bilan davom (50MB gacha ruxsat)
                if (chosenFile.size > 50 * 1024 * 1024) {
                  toast("Video juda katta, siqib ham bo'lmadi", 3800);
                  nextBtn.disabled = false;
                  skipBtn.disabled = false;
                  input.disabled = false;
                  clearProgress();
                  return;
                }
              }
            } else {
              // Brauzer MediaRecorder'ni qo'llamasa, original 50MB gacha
              if (chosenFile.size > 50 * 1024 * 1024) {
                toast("Brauzer video siqishni qo'llamaydi (fayl > 50MB)", 3800);
                nextBtn.disabled = false;
                skipBtn.disabled = false;
                input.disabled = false;
                return;
              }
            }
          }

          setProgress("Yuklanmoqda...", 0);
          const info = await getSignedUploadUrl(uploadName, uploadType);
          await uploadToSignedUrl(info.signedUrl, toUpload, uploadType, (frac) => {
            setProgress("Yuklanmoqda...", frac);
          });
          setProgress("Botga yuborilyapti...", 1);
          const res = await notifyVideoUploaded(info.path, q.question || "");
          if (!res || res.ok !== true) {
            const desc = (res && res.tg && (res.tg.description || res.tg.error)) || (res && res.error) || "botga yetkazib bo'lmadi";
            toast("Yuklashda xatolik, qayta urinib ko'ring. (" + desc + ")", 4500);
            nextBtn.disabled = false;
            skipBtn.disabled = false;
            input.disabled = false;
            nextBtn.textContent = "QAYTA YUBORISH";
            return;
          }
          answers.push({ q: q.question, a: "[video yuborildi]" });
        } catch (err) {
          console.warn("video upload err", err);
          toast("Yuklashda xatolik, qayta urinib ko'ring. (" + (err && err.message || err) + ")", 4500);
          nextBtn.disabled = false;
          skipBtn.disabled = false;
          input.disabled = false;
          nextBtn.textContent = "QAYTA YUBORISH";
          clearProgress();
          return;
        }
        nextQuestion();
      });

      skipBtn.addEventListener("click", () => {
        reportAnswer(q.question, "Video joylamadi");
        nextQuestion();
      });
    });
  }

  // ---------- Confetti ----------
  let confettiRunning = false;
  function runConfetti(durationMs) {
    if (confettiRunning) return;
    confettiRunning = true;
    const canvas = confettiCanvas;
    const ctx = canvas.getContext("2d");
    const phone = document.getElementById("phone");
    function resize() {
      canvas.width = phone.clientWidth;
      canvas.height = phone.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#ffffff", "#ffd0e0", "#ff9ec2", "#ffe1a8", "#ffb3d1"];
    const bits = [];
    for (let i = 0; i < 140; i++) {
      bits.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 3,
        s: 4 + Math.random() * 6,
        c: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2
      });
    }
    const start = Date.now();
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
        if (b.y > canvas.height + 20) {
          b.y = -20;
          b.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.5);
        ctx.restore();
      });
      if (Date.now() - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiRunning = false;
      }
    }
    tick();
  }

  function heartsExplosion() {
    const phone = document.getElementById("phone");
    for (let i = 0; i < 24; i++) {
      const h = document.createElement("span");
      h.textContent = "❤";
      h.style.position = "absolute";
      h.style.left = "50%";
      h.style.top = "50%";
      h.style.color = "#fff";
      h.style.fontSize = (20 + Math.random() * 24) + "px";
      h.style.pointerEvents = "none";
      h.style.zIndex = "5";
      h.style.transition = "transform 1.6s ease, opacity 1.6s ease";
      phone.appendChild(h);
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 160;
      requestAnimationFrame(() => {
        h.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(${1 + Math.random()})`;
        h.style.opacity = "0";
      });
      setTimeout(() => h.remove(), 1700);
    }
  }

  function renderFinal(q) {
    showScreen((s) => {
      const wrap = document.createElement("div");
      wrap.className = "final-wrap";
      s.appendChild(wrap);
      const t = document.createElement("div");
      t.className = "final-text";
      wrap.appendChild(t);

      runConfetti(6000);
      heartsExplosion();
      setTimeout(heartsExplosion, 800);
      setTimeout(heartsExplosion, 1600);

      // typewriter (yangi qatorlarni saqlab)
      const text = q.finalText || "";
      let i = 0;
      const step = () => {
        if (i <= text.length) {
          t.textContent = text.slice(0, i);
          i++;
          setTimeout(step, 55);
        } else {
          // yakuniy xulosani jo'natish
          sendJSON({ type: "summary", answers });
        }
      };
      step();
    });
  }

  // =========================================================
  // Router
  // =========================================================
  function render() {
    if (currentIndex >= questions.length) return;
    const q = questions[currentIndex];
    if (!q || !q.type) { nextQuestion(); return; }
    updateProgress();
    switch (q.type) {
      case "yesno_shrink": return renderYesNoShrink(q);
      case "choice":       return renderChoice(q);
      case "text":         return renderText(q);
      case "text_idle":    return renderText(q, { idle: true });
      case "yesno_runaway":return renderYesNoRunaway(q);
      case "upload_image": return renderUploadImage(q);
      case "upload_video": return renderUploadVideo(q);
      case "final":        return renderFinal(q);
      default:             return nextQuestion();
    }
  }

  render();
})();
