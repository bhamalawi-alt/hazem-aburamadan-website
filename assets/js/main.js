/* hazemaburamadan.com — scroll-linked interactions (GSAP + ScrollTrigger + Lenis) */
/* ---------- project brief form (runs with or without animations) ---------- */
(() => {
  const form = document.querySelector(".brief");
  if (!form) return;
  const KEY = form.dataset.accessKey || "";          // Web3Forms access key (public by design); empty = open the visitor's email app
  const ENDPOINT = KEY ? "https://api.web3forms.com/submit" : "";
  const steps = [...form.querySelectorAll(".brief__step")];
  const back = form.querySelector("[data-back]"), next = form.querySelector("[data-next]"), send = form.querySelector("[data-send]");
  const count = form.querySelector(".brief__count b"), bar = form.querySelector(".brief__progress i"), status = form.querySelector(".brief__status");
  let i = 0;
  form.classList.add("is-stepped");
  form.noValidate = true;

  const say = (msg, cls = "") => { status.textContent = msg; status.className = "brief__status " + cls; };
  const show = (n, focus) => {
    i = n;
    steps.forEach((s, k) => s.classList.toggle("is-current", k === i));
    count.textContent = i + 1;
    bar.style.width = ((i + 1) / steps.length) * 100 + "%";
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    send.hidden = i !== steps.length - 1;
    say("");
    if (focus) steps[i].querySelector("input, textarea").focus({ preventScroll: true });
    window.ScrollTrigger?.refresh();
  };
  const valid = (step) => {
    for (const el of step.querySelectorAll("input, textarea")) {
      if (el.name === "_gotcha" || el.checkValidity()) continue;
      say(el.type === "radio" ? "اختر إجابة للمتابعة." : el.type === "email" && el.value ? "تحقّق من البريد الإلكتروني." : "أكمل الحقول المطلوبة للمتابعة.", "is-error");
      if (el.type !== "radio") el.focus();
      return false;
    }
    return true;
  };
  next.addEventListener("click", () => valid(steps[i]) && show(i + 1, true));
  back.addEventListener("click", () => show(i - 1, true));
  // picking the project type moves on by itself
  steps[0].addEventListener("change", () => setTimeout(() => i === 0 && show(1), 250));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!valid(steps[i])) return;
    const data = new FormData(form);
    if (data.get("_gotcha")) return;
    data.delete("_gotcha");
    if (!ENDPOINT) {
      const body = [...data].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
      location.href = "mailto:contact@hazemaburamadan.com?subject=" + encodeURIComponent("مشروع جديد — " + data.get("نوع المشروع")) + "&body=" + encodeURIComponent(body);
      form.classList.add("is-sent");
      say("فُتح تطبيق البريد برسالة جاهزة — اضغط إرسال لإتمام الطلب.", "is-ok");
      return;
    }
    data.append("access_key", KEY);
    data.append("subject", "مشروع جديد — " + data.get("نوع المشروع"));
    data.append("from_name", "موقع حازم أبو رمضان");
    data.append("replyto", data.get("البريد الإلكتروني"));
    send.disabled = true;
    say("جارٍ الإرسال…");
    try {
      const r = await fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: data });
      if (!r.ok || (await r.json()).success === false) throw new Error(r.status);
      form.classList.add("is-sent");
      say("وصلت تفاصيل مشروعك. سأراجعها وأعود إليك بالخطوة المناسبة.", "is-ok");
    } catch {
      send.disabled = false;
      say("تعذّر الإرسال. حاول مرة أخرى أو راسلني على contact@hazemaburamadan.com", "is-error");
    }
    window.ScrollTrigger?.refresh();
  });
  show(0);
})();

(() => {
  const portrait = matchMedia("(max-width: 860px) and (orientation: portrait)").matches;
  const SEQ = portrait
    ? { dir: "assets/seqm", count: 101, fx: 0.5, fy: 1 }       // tall clip: subject low, space above
    : { dir: "assets/seq", count: 101, fx: 0.25, fy: 0.2 };    // wide clip: subject left, space right
  const FRAME_COUNT = SEQ.count;
  const framePath = (i) => `${SEQ.dir}/f_${String(i + 1).padStart(3, "0")}.webp`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (reduce || !window.gsap) return;           // static, readable page (see CSS)
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const target = $(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
    })
  );

  /* ---------- progress bar + header ---------- */
  gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
  const top = $(".top");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      top.classList.toggle("is-solid", self.scroll() > 80);
    },
  });

  /* ---------- hero: scrubbed image sequence ---------- */
  const canvas = $(".hero__canvas");
  const ctx = canvas.getContext("2d");
  const frames = new Array(FRAME_COUNT);
  const state = { frame: 0 };
  let drawn = -1;

  const sizeCanvas = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    drawn = -1;
    draw();
  };
  const nearestLoaded = (i) => {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (frames[i - d]?.complete && frames[i - d].naturalWidth) return frames[i - d];
      if (frames[i + d]?.complete && frames[i + d].naturalWidth) return frames[i + d];
    }
    return null;
  };
  function draw() {
    const i = Math.round(state.frame);
    const img = nearestLoaded(i);
    if (!img) return;
    if (i === drawn && frames[i] === img) return;
    drawn = frames[i] === img ? i : -1;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);   // cover
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) * SEQ.fx, (ch - h) * SEQ.fy, w, h);        // keep the subject in frame
    canvas.classList.add("is-ready");
  }
  // load frame 0 first, then the rest in scroll order
  const load = (i) => new Promise((res) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = img.onerror = () => { draw(); res(); };
    img.src = framePath(i);
    frames[i] = img;
  });
  load(0).then(async () => {
    sizeCanvas();
    for (let i = 1; i < FRAME_COUNT; i += 6) {
      await Promise.all([0, 1, 2, 3, 4, 5].map((k) => (i + k < FRAME_COUNT ? load(i + k) : null)));
    }
  });
  addEventListener("resize", sizeCanvas);

  const phases = $$(".hero__copy");
  gsap.set(phases, { autoAlpha: 0, y: 40 });
  gsap.set(phases[0], { autoAlpha: 1, y: 0 });
  const heroTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.6 },
  });
  heroTl
    .to(state, { frame: FRAME_COUNT - 1, duration: 10, onUpdate: draw }, 0)
    .to(".hero__cue", { autoAlpha: 0, duration: 0.6 }, 0.2)
    .to(phases[0], { autoAlpha: 0, y: -50, duration: 1 }, 2.4)
    .to(phases[1], { autoAlpha: 1, y: 0, duration: 1 }, 3.6)
    .to(phases[1], { autoAlpha: 0, y: -50, duration: 1 }, 6)
    .to(phases[2], { autoAlpha: 1, y: 0, duration: 1 }, 7.2)
    .to(".hero__scrim", { backgroundColor: "rgba(11,11,12,.25)", duration: 2 }, 8);

  // count-up numbers, driven by the same scroll
  $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count, o = { v: 0 };
    heroTl.fromTo(o, { v: 0 }, { v: end, duration: 1.4, onUpdate: () => (el.textContent = Math.round(o.v)) }, 3.6);
  });

  /* ---------- marquee: drifts, and reacts to scroll velocity ---------- */
  const track = $(".marquee__track");
  const half = () => track.scrollWidth / 2;
  let mx = 0, boost = 0;
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => (boost = self.getVelocity() / 260) });
  gsap.ticker.add(() => {
    mx -= 0.7 + Math.abs(boost);
    boost *= 0.92;
    if (-mx >= half()) mx += half();
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* ---------- about: words light up as you read ---------- */
  $$(".reveal-words").forEach((p) => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    gsap.to($$(".w", p), {
      opacity: 1, stagger: 0.12, ease: "none",
      scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: 0.4 },
    });
  });
  gsap.to(".about__frame", { clipPath: "inset(0% 0 0 0)", ease: "none", scrollTrigger: { trigger: ".about__media", start: "top 88%", end: "top 30%", scrub: 0.5 } });
  gsap.fromTo(".about__frame img", { yPercent: -13 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".about__media", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- journey: one milestone at a time beside his photo ---------- */
  const marks = [0, 0.25, 0.5, 0.75];            // scroll progress at which each milestone takes over
  const steps = $$(".journey__steps li"), tabs = $$(".journey__tabs li");
  const mm = gsap.matchMedia();
  let current = -1;
  const showStep = (p) => {                       // one milestone on screen at a time
    const idx = Math.max(0, marks.filter((m) => p >= m - 0.01).length - 1);
    if (idx === current) return;
    current = idx;
    steps.forEach((s, i) => s.classList.toggle("is-current", i === idx));
    tabs.forEach((t, i) => t.classList.toggle("is-current", i === idx));
  };
  gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".journey", start: "top top", end: "+=260%", pin: ".journey__stage", scrub: 0.5 },
  })
    .to(".journey__bar i", { scaleX: 1, duration: 1, onUpdate() { showStep(this.progress()); } }, 0)
    .fromTo(".journey__photo img", { scale: 1.18 }, { scale: 1, duration: 1 }, 0);   // slow pull-back as you scroll
  showStep(0);

  /* ---------- services: horizontal scroll (RTL: track travels right) ---------- */
  const sTrack = $(".services__track");
  const travel = () => Math.max(0, sTrack.scrollWidth - innerWidth);
  gsap.to(sTrack, {
    x: travel, ease: "none",
    scrollTrigger: { trigger: ".services", start: "top top", end: () => "+=" + travel(), pin: ".services__stage", scrub: 0.6, invalidateOnRefresh: true },
  });

  /* ---------- videos / plans: rise in ---------- */
  [[".video", ".videos__grid"], [".plan", ".consult__grid"]].forEach(([item, wrap]) => {
    gsap.from(item, { y: 90, autoAlpha: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: wrap, start: "top 82%" } });
  });
  $$("section h2, .contact__big").forEach((h) => {
    if (h.closest(".hero")) return;
    gsap.from(h, { y: 60, autoAlpha: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 88%" } });
  });

  /* ---------- voices: columns slide against each other ---------- */
  // over the light band the header switches to dark text and the dark-H logo
  ScrollTrigger.create({ trigger: ".voices", start: "top 50px", end: "bottom 50px", toggleClass: { targets: top, className: "is-light" } });
  mm.add("(min-width: 701px)", () => {
    $$(".voices__col").forEach((col) => {
      gsap.fromTo(col, { y: -col.dataset.speed }, { y: +col.dataset.speed, ease: "none", scrollTrigger: { trigger: ".voices__cols", start: "top bottom", end: "bottom top", scrub: true } });
    });
  });

  /* ---------- contact: background drift ---------- */
  gsap.fromTo(".contact__bg", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom bottom", scrub: true } });

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
