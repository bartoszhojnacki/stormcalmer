const STORE_KEY = "storm.v1";
const DAY_START_HOUR = 4; // wpis o 1:00 w nocy liczy się jeszcze do poprzedniego dnia
const WEEKDAYS_ON = ["w poniedziałki", "we wtorki", "w środy", "w czwartki", "w piątki", "w soboty", "w niedziele"];

function dayKey(d = new Date()) {
  const x = new Date(d);
  if (x.getHours() < DAY_START_HOUR) x.setDate(x.getDate() - 1);
  return x.toLocaleDateString("sv-SE"); // YYYY-MM-DD w czasie lokalnym
}

function shiftDay(key, delta) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString("sv-SE");
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function emptyState() {
  return { version: 1, days: {}, entries: [], habits: DEFAULT_HABITS.map((h) => ({ ...h })), profile: {}, checks: [] };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

const resolve = (v, ...args) => (typeof v === "function" ? v(...args) : v);

document.addEventListener("alpine:init", () => {
  Alpine.data("storm", () => ({
    s: loadState(),
    tab: "dzis",
    today: dayKey(),
    // aktywny przebieg kroków (ćwiczenie albo rytuał)
    run: null,     // { kind: 'exercise'|'ritual'|'flow', key, def, i, answers, done }
    timer: null,   // { left, phase, handle }
    sosWeather: null,
    openEntry: null,
    habitForm: null,
    importMsg: "",
    pendingImport: null,
    showInstall: false,
    preview: null, // pogoda pokazywana na powitaniu (niebo przechodzi przez wszystkie)

    WEATHERS, EXERCISES, RITUALS, HABIT_SUGGESTIONS, BASELINE_ITEMS,

    init() {
      if (navigator.storage?.persist) navigator.storage.persist();
      // po powrocie do apki następnego dnia przelicz "dziś"
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.today = dayKey();
      });
      this.sosWeather = this.peekDay(this.today)?.weather || this.s.profile?.storms?.[0] || null;
      // nowy użytkownik (zero danych): najpierw instalacja, potem pierwszy rejs
      const fresh = !this.s.profile?.onboardedAt && !this.s.profile?.skippedAt
        && !Object.keys(this.s.days).length && !this.s.entries.length;
      if (fresh) {
        if (this.isStandalone()) this.start("flow", "onboarding");
        else this.showInstall = true;
      }
    },

    // ---------- instalacja ----------
    isStandalone() {
      return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    },
    isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    },
    skipInstall() {
      this.showInstall = false;
      this.start("flow", "onboarding");
    },

    save() {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.s));
    },

    // ---------- niebo ----------
    skyDef() {
      if (this.preview) return this.weather(this.preview);
      let id = this.peekDay(this.today)?.weather;
      if (this.tab === "burza" && this.sosWeather) id = this.sosWeather;
      if (this.run?.kind === "exercise" && this.sosWeather) id = this.sosWeather;
      if (this.run?.answers.weather) id = this.run.answers.weather;
      if (this.run?.answers.storms?.length) id = this.run.answers.storms.at(-1);
      return this.weather(id) || DEFAULT_SKY;
    },
    paintSky() {
      const w = this.skyDef();
      // po ćwiczeniu, które obniżyło napięcie, morze się uspokaja
      const calmed = this.run?.done && (this.delta(this.run.answers) ?? 0) < 0;
      const root = document.documentElement.style;
      root.setProperty("--s1", w.sky[0]);
      root.setProperty("--s2", w.sky[1]);
      root.setProperty("--s3", w.sky[2]);
      root.setProperty("--sea", w.sea);
      root.setProperty("--amp", calmed ? w.amp * 0.4 : w.amp);
      document.documentElement.dataset.sky = w.id;
      document.querySelector('meta[name="theme-color"]').content = w.sky[0];
    },

    // ---------- dni ----------
    day(key = this.today) {
      if (!this.s.days[key]) this.s.days[key] = { habits: {} };
      return this.s.days[key];
    },
    peekDay(key) {
      return this.s.days[key] || null;
    },
    weather(id) {
      return WEATHERS.find((w) => w.id === id);
    },
    todayLabel() {
      return new Date(this.today + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
    },

    quoteFor(key, weatherId) {
      const pool = weatherId ? QUOTES.filter((q) => q.w.includes(weatherId)) : QUOTES;
      const list = pool.length ? pool : QUOTES;
      return list[hash(key + (weatherId || "")) % list.length];
    },
    todayQuote() {
      return this.quoteFor(this.today, this.peekDay(this.today)?.weather);
    },

    // ---------- silnik kroków ----------
    start(kind, key) {
      const def = { exercise: EXERCISES, ritual: RITUALS, flow: FLOWS }[kind][key];
      const answers = {};
      const p = this.s.profile || {};
      if (key === "onboarding") {
        // powtórka startuje z dotychczasowymi odpowiedziami
        Object.assign(answers, {
          storms: [...(p.storms || [])],
          goal: p.goal || "",
          habits: [],
          rhythm: { morning: "07:30", evening: "21:30", ...(p.rhythm || {}) },
        });
      }
      if (def.steps.some((st) => st.type === "baseline")) {
        answers.baseline = Object.fromEntries(BASELINE_ITEMS.map((b) => [b.id, 5]));
      }
      const w = this.peekDay(this.today)?.weather;
      if (kind === "ritual" && key === "poranek" && w) answers.weather = w;
      this.run = { kind, key, def, i: 0, answers, done: false };
      this.enterStep();
    },
    enterStep() {
      const st = this.step();
      this.stopPreview();
      if (st.type === "intro") this.startPreview();
      if (st.type === "scale" && this.run.answers[st.id] == null) this.run.answers[st.id] = 5;
      if (st.type === "timer") this.startTimer(st.seconds);
      window.scrollTo(0, 0);
    },
    visibleSteps() {
      if (!this.run) return [];
      const day = this.peekDay(this.today) || {};
      return this.run.def.steps.filter((st) => !st.showIf || st.showIf(this.run.answers, day));
    },
    step() {
      return this.run ? this.visibleSteps()[this.run.i] : null;
    },
    // Bezpieczne skróty dla szablonu: Alpine potrafi jeszcze przeliczyć pola
    // zamykanego przebiegu, gdy run jest już null.
    get st() { return this.step() || {}; },
    get ans() { return this.run?.answers || {}; },
    get bl() { return this.ans.baseline || {}; },
    get rh() { return this.ans.rhythm || {}; },
    picked(id) { return this.pickedHabit(id) || {}; },
    stepText(field) {
      const st = this.step();
      return st ? resolve(st[field], this.run.answers, this.peekDay(this.today) || {}) : "";
    },
    progress() {
      if (!this.run) return 0;
      return ((this.run.i + 1) / this.visibleSteps().length) * 100;
    },
    canNext() {
      const st = this.step();
      if (!st) return false;
      const v = this.run.answers[st.id];
      if (st.type === "weather" || st.type === "choice") return !!v;
      if (st.type === "lines") return this.lines(v).length > 0;
      if (st.type === "classify") {
        const items = this.lines(this.run.answers[st.from]);
        return items.every((it) => (v || {})[it]);
      }
      if (st.type === "timer") return !this.timer;
      if (st.type === "storms") return v.length > 0;
      return true; // pola tekstowe są opcjonalne: lepiej coś niż nic
    },
    next() {
      this.stopTimer();
      const steps = this.visibleSteps();
      if (this.run.i < steps.length - 1) {
        this.run.i++;
        this.enterStep();
      } else {
        this.finish();
      }
    },
    back() {
      this.stopTimer();
      if (this.run.i > 0) this.run.i--;
      else this.run = null;
    },
    cancel() {
      this.stopTimer();
      this.stopPreview();
      // przerwany pierwszy rejs nie wraca sam; zostaje karta na ekranie Dziś
      if (this.run?.key === "onboarding") {
        this.s.profile = { ...this.s.profile, skippedAt: this.today };
        this.save();
      }
      this.run = null;
    },

    startPreview() {
      const ids = WEATHERS.map((w) => w.id);
      let i = 0;
      this.preview = ids[0];
      this._previewHandle = setInterval(() => (this.preview = ids[++i % ids.length]), 2600);
    },
    stopPreview() {
      clearInterval(this._previewHandle);
      this.preview = null;
    },

    // ---------- podpowiedzi do pisania ----------
    isTextStep() {
      return ["text", "textarea", "lines"].includes(this.st.type);
    },
    // Ostatnie własne odpowiedzi z tego samego pola (najnowsze pierwsze, krótkie, bez powtórek)
    recentFor(key, id) {
      let values;
      if (this.run?.kind === "exercise") {
        values = this.s.entries.filter((e) => e.exercise === key).map((e) => e.answers[id]);
      } else if (this.run?.kind === "ritual") {
        values = Object.keys(this.s.days).sort().reverse().map((k) => this.s.days[k][id]);
      } else values = [];
      const out = [];
      for (const v of values) {
        const lines = this.st.type === "lines" ? this.lines(v) : [v];
        for (const x of lines) {
          const t = (x || "").trim();
          if (t && t.length <= 40 && !out.includes(t)) out.push(t);
        }
        if (out.length >= 3) break;
      }
      return out.slice(0, 3);
    },
    chipsFor() {
      if (!this.run || !this.isTextStep()) return [];
      const base = CHIPS[`${this.run.key}.${this.st.id}`] || [];
      const recent = this.recentFor(this.run.key, this.st.id).filter((r) => !base.includes(r));
      return [...recent.map((t) => ({ t, mine: true })), ...base.map((t) => ({ t, mine: false }))];
    },
    isStarter(t) {
      return t.endsWith("…");
    },
    chipOn(t) {
      const v = this.ans[this.st.id] || "";
      return !this.isStarter(t) && v.includes(t);
    },
    addChip(t, el) {
      const id = this.st.id;
      const cur = (this.ans[id] || "").trimEnd();
      const starter = this.isStarter(t);
      const text = starter ? t.slice(0, -1) + " " : t;
      if (!starter && cur.includes(t)) {
        // drugie stuknięcie usuwa podpowiedź
        this.run.answers[id] = this.st.type === "lines"
          ? this.lines(cur).filter((x) => x !== t).join("\n")
          : cur.split(/,\s*/).filter((x) => x.trim() !== t).join(", ");
        return;
      }
      const sep = !cur ? "" : this.st.type === "lines" ? "\n" : starter ? " " : ", ";
      this.run.answers[id] = cur + sep + text;
      if (starter) {
        // początek zdania: kursor na końcu, klawiatura gotowa do dokończenia
        this.$nextTick(() => {
          const f = el.closest(".step").querySelector(".field");
          f?.focus();
          f?.setSelectionRange(f.value.length, f.value.length);
        });
      }
    },

    // ---------- kroki onboardingu ----------
    toggleStorm(id) {
      const cur = this.run.answers.storms;
      const i = cur.indexOf(id);
      if (i >= 0) cur.splice(i, 1);
      else {
        cur.push(id);
        if (cur.length > 2) cur.shift();
      }
    },
    suggestedHabits() {
      const storms = this.run?.answers.storms || [];
      const score = (h) => (h.for.some((w) => storms.includes(w)) ? 0 : 1);
      return [...HABIT_SUGGESTIONS].sort((a, b) => score(a) - score(b));
    },
    pickedHabit(id) {
      return this.run?.answers.habits?.find((h) => h.id === id);
    },
    toggleHabitPick(sug) {
      const list = this.run.answers.habits;
      const i = list.findIndex((h) => h.id === sug.id);
      if (i >= 0) list.splice(i, 1);
      else if (list.length < 3) list.push({ id: sug.id, name: sug.name, min: sug.min, anchor: sug.anchor });
    },
    lines(v) {
      return (v || "").split("\n").map((x) => x.trim()).filter(Boolean);
    },
    classify(stepId, item, value) {
      this.run.answers[stepId] = { ...(this.run.answers[stepId] || {}), [item]: value };
    },
    toggleMulti(stepId, value) {
      const cur = new Set(this.run.answers[stepId] || []);
      cur.has(value) ? cur.delete(value) : cur.add(value);
      this.run.answers[stepId] = [...cur];
    },

    startTimer(seconds) {
      this.timer = { left: seconds, elapsed: 0, handle: null };
      // mutujemy przez this.timer (proxy Alpine), żeby widok się odświeżał
      this.timer.handle = setInterval(() => {
        this.timer.left--;
        this.timer.elapsed++;
        if (this.timer.left <= 0) this.stopTimer();
      }, 1000);
    },
    stopTimer() {
      if (this.timer) clearInterval(this.timer.handle);
      this.timer = null;
    },
    breathPhase() {
      if (!this.timer) return "Gotowe";
      return this.timer.elapsed % 10 < 4 ? "Wdech" : "Wydech";
    },

    finish() {
      const { kind, key, answers } = this.run;
      if (key === "onboarding") return this.finishOnboarding(answers);
      if (key === "checkin") {
        this.s.checks.push({ day: this.today, ...answers.baseline });
        this.s.profile.cards = { ...(this.s.profile.cards || {}), [this.currentCard()?.id]: true };
      } else if (kind === "exercise") {
        this.s.entries.unshift({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          ts: new Date().toISOString(),
          day: this.today,
          exercise: key,
          weather: this.sosWeather,
          answers: JSON.parse(JSON.stringify(answers)),
        });
      } else {
        const d = this.day();
        Object.assign(d, JSON.parse(JSON.stringify(answers)));
        d[key === "poranek" ? "morningAt" : "eveningAt"] = new Date().toISOString();
        if (key === "poranek") this.sosWeather = d.weather;
      }
      this.save();
      this.run.done = true;
      window.scrollTo(0, 0);
    },
    finishOnboarding(a) {
      const answers = JSON.parse(JSON.stringify(a));
      const repeat = !!this.s.profile?.onboardedAt;
      this.s.profile = {
        ...this.s.profile,
        onboardedAt: this.s.profile?.onboardedAt || this.today,
        storms: answers.storms,
        goal: (answers.goal || "").trim(),
        rhythm: answers.rhythm,
        cards: this.s.profile?.cards || {},
      };
      const check = { day: this.today, ...answers.baseline };
      // powtórka nie kasuje historii: nowy pomiar dopisuje się do starych
      this.s.checks = repeat ? [...(this.s.checks || []), check] : [check];
      const newHabits = answers.habits.map((h) => ({ ...h, id: "h-" + h.id.slice(2) + "-" + Date.now().toString(36) }));
      if (repeat) {
        const names = new Set(this.activeHabits().map((h) => h.name));
        this.s.habits.push(...newHabits.filter((h) => !names.has(h.name)));
      } else if (newHabits.length) {
        // domyślne nawyki bez historii znikają, z historią trafiają do archiwum
        const used = new Set(Object.values(this.s.days).flatMap((d) => Object.keys(d.habits || {})));
        this.s.habits = this.s.habits.filter((h) => used.has(h.id)).map((h) => ({ ...h, archived: true }));
        this.s.habits.push(...newHabits);
      }
      this.sosWeather = this.peekDay(this.today)?.weather || answers.storms[0] || null;
      this.save();
      this.stopPreview();
      this.start("ritual", new Date().getHours() < 16 ? "poranek" : "wieczor");
    },

    // ---------- podróż: karty pierwszych tygodni ----------
    daysSinceOnboard() {
      const start = this.s.profile?.onboardedAt;
      if (!start) return null;
      return Math.round((new Date(this.today + "T12:00:00") - new Date(start + "T12:00:00")) / 86400000);
    },
    currentCard() {
      const n = this.daysSinceOnboard();
      if (n == null) return null;
      const seen = this.s.profile.cards || {};
      // najnowsza nieodhaczona karta, której dzień już nadszedł (najwyżej tydzień po terminie)
      return [...JOURNEY].reverse().find((c) => c.day <= n && n - c.day <= 7 && !seen[c.id]) || null;
    },
    dismissCard(card) {
      this.s.profile.cards = { ...(this.s.profile.cards || {}), [card.id]: true };
      this.save();
    },
    goCard(card) {
      const [kind, key] = card.go;
      if (kind !== "flow") this.dismissCard(card); // punkt kontrolny odhacza się dopiero po odpowiedzi
      if (kind === "tab") this.tab = key;
      else this.start(kind, key);
    },
    showPort() {
      const w = this.peekDay(this.today)?.weather;
      return !!this.s.profile?.goal && w && w !== "pogodnie";
    },
    rhythmHint() {
      const r = this.s.profile?.rhythm || this.run?.answers.rhythm || { morning: "07:30", evening: "21:30" };
      return `Skróty → Automatyzacja → Nowa → Pora dnia: ${r.morning} → Otwórz aplikację → Stormcalmer. Druga taka sama na ${r.evening}.`;
    },
    progressRows() {
      const c = this.s.checks || [];
      if (c.length < 2) return [];
      const first = c[0], last = c.at(-1);
      return BASELINE_ITEMS.map((b) => ({ ...b, from: first[b.id], to: last[b.id] }));
    },

    summary(def, answers) {
      return def.steps
        .filter((st) => st.id && st.label && answers[st.id] != null && answers[st.id] !== "")
        .map((st) => ({ label: st.label, value: this.formatAnswer(st, answers[st.id], answers) }))
        .filter((r) => r.value);
    },
    formatAnswer(st, v) {
      if (st.type === "classify") {
        return Object.entries(v).map(([k, val]) => `${k} → ${st.options.find((o) => o.v === val)?.label}`).join("\n");
      }
      if (st.type === "multi") return v.map((id) => st.options.find((o) => o.id === id)?.label).join(", ");
      if (st.type === "choice") return st.options.find((o) => o.v === v)?.label;
      if (st.type === "scale") return `${v}/10`;
      if (st.type === "baseline") return BASELINE_ITEMS.map((b) => `${b.label} ${v[b.id]}/10`).join("\n");
      return String(v);
    },
    runAnswer(key) {
      return this.run?.answers?.[key] ?? "";
    },
    delta(answers) {
      if (answers.before == null || answers.after == null) return null;
      return answers.after - answers.before;
    },

    // ---------- SOS ----------
    sosList() {
      const rec = RECOMMEND[this.sosWeather] || [];
      const rest = Object.keys(EXERCISES).filter((k) => !rec.includes(k));
      return { rec, rest };
    },

    // ---------- nawyki ----------
    activeHabits() {
      return this.s.habits.filter((h) => !h.archived);
    },
    habitState(hid, key = this.today) {
      return this.peekDay(key)?.habits?.[hid] || null;
    },
    setHabit(hid, value) {
      const d = this.day();
      d.habits = d.habits || {};
      d.habits[hid] = d.habits[hid] === value ? null : value;
      this.save();
    },
    lastDays(n) {
      return Array.from({ length: n }, (_, i) => shiftDay(this.today, i - n + 1));
    },
    habitWeek(hid) {
      return this.lastDays(7).filter((k) => ["done", "min"].includes(this.habitState(hid, k))).length;
    },
    newHabit() {
      this.habitForm = { id: null, icon: "✨", name: "", min: "" };
    },
    editHabit(h) {
      this.habitForm = { ...h };
    },
    saveHabit() {
      const f = this.habitForm;
      if (!f.name.trim()) return;
      if (f.id) {
        Object.assign(this.s.habits.find((h) => h.id === f.id), f);
      } else {
        this.s.habits.push({ ...f, id: "h-" + Date.now().toString(36) });
      }
      this.habitForm = null;
      this.save();
    },
    archiveHabit() {
      const h = this.s.habits.find((x) => x.id === this.habitForm.id);
      if (h) h.archived = true;
      this.habitForm = null;
      this.save();
    },

    // ---------- klimat ----------
    calendar() {
      // 5 pełnych tygodni, od poniedziałku, kończąc na bieżącym tygodniu
      const todayDow = (new Date(this.today + "T12:00:00").getDay() + 6) % 7;
      const start = shiftDay(this.today, -todayDow - 28);
      return Array.from({ length: 35 }, (_, i) => {
        const key = shiftDay(start, i);
        return { key, future: key > this.today, w: this.peekDay(key)?.weather, num: +key.slice(8) };
      });
    },
    climate() {
      const keys = this.lastDays(30);
      const counts = Object.fromEntries(WEATHERS.map((w) => [w.id, 0]));
      const byDow = WEATHERS.reduce((acc, w) => ({ ...acc, [w.id]: Array(7).fill(0) }), {});
      let logged = 0;
      for (const k of keys) {
        const w = this.peekDay(k)?.weather;
        if (!w) continue;
        logged++;
        counts[w]++;
        byDow[w][(new Date(k + "T12:00:00").getDay() + 6) % 7]++;
      }
      const max = Math.max(1, ...Object.values(counts));
      const patterns = WEATHERS.filter((w) => w.id !== "pogodnie" && counts[w.id] >= 3).map((w) => {
        const arr = byDow[w.id];
        const top = arr.indexOf(Math.max(...arr));
        return { w, day: WEEKDAYS_ON[top], n: arr[top] };
      }).filter((p) => p.n >= 2);
      return { logged, counts, max, patterns };
    },
    forecastStats() {
      const days = Object.values(this.s.days).filter((d) => d.forecast && d.happened);
      const n = days.length;
      const notHappened = days.filter((d) => d.happened === "nie").length;
      const hit = days.filter((d) => d.severity);
      const lighter = hit.filter((d) => d.severity === "lzej").length;
      return { n, notHappened, notPct: n ? Math.round((notHappened / n) * 100) : 0, hitN: hit.length, lighterPct: hit.length ? Math.round((lighter / hit.length) * 100) : 0 };
    },
    sosStats() {
      const withDelta = this.s.entries.map((e) => this.delta(e.answers)).filter((d) => d != null);
      const avg = withDelta.length ? withDelta.reduce((a, b) => a + b, 0) / withDelta.length : 0;
      return { n: this.s.entries.length, avg: avg.toFixed(1).replace(".", ",") };
    },
    journal() {
      const evenings = Object.entries(this.s.days)
        .filter(([, d]) => d.eveningAt)
        .map(([k, d]) => ({ id: "e-" + k, ts: d.eveningAt, kind: "wieczor", day: k, answers: d }));
      const ex = this.s.entries.map((e) => ({ ...e, kind: "exercise" }));
      // unikalne klucze dla x-for (stare kopie mogą mieć zdublowane id)
      const seen = new Set();
      return [...ex, ...evenings]
        .sort((a, b) => b.ts.localeCompare(a.ts))
        .slice(0, 40)
        .map((e) => {
          let key = e.id;
          while (seen.has(key)) key += "·";
          seen.add(key);
          return { ...e, key };
        });
    },
    entryDef(e) {
      return e.kind === "exercise" ? EXERCISES[e.exercise] : RITUALS.wieczor;
    },
    fmtDate(ts) {
      return new Date(ts).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    },

    // ---------- kopia ----------
    async exportData() {
      const json = JSON.stringify(this.s, null, 2);
      const name = `stormcalmer-${this.today}.json`;
      const file = new File([json], name, { type: "application/json" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Stormcalmer: kopia" });
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    async pickImport(ev) {
      const f = ev.target.files[0];
      ev.target.value = "";
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data.days || !Array.isArray(data.entries) || !Array.isArray(data.habits)) throw new Error();
        this.pendingImport = data;
        this.importMsg = `Plik zawiera ${Object.keys(data.days).length} dni i ${data.entries.length} ćwiczeń. Zastąpi obecne dane na tym urządzeniu.`;
      } catch {
        this.pendingImport = null;
        this.importMsg = "To nie wygląda na kopię Stormcalmera.";
      }
    },
    confirmImport() {
      this.s = { ...emptyState(), ...this.pendingImport };
      this.save();
      this.pendingImport = null;
      this.importMsg = "Wczytano. ✓";
    },
  }));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
