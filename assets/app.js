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
  return { version: 1, days: {}, entries: [], habits: DEFAULT_HABITS.map((h) => ({ ...h })) };
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
    run: null,     // { kind: 'exercise'|'ritual', key, def, i, answers, done }
    timer: null,   // { left, phase, handle }
    sosWeather: null,
    openEntry: null,
    habitForm: null,
    importMsg: "",
    pendingImport: null,

    WEATHERS, EXERCISES, RITUALS,

    init() {
      if (navigator.storage?.persist) navigator.storage.persist();
      // po powrocie do apki następnego dnia przelicz "dziś"
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.today = dayKey();
      });
      this.sosWeather = this.day().weather || null;
    },

    save() {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.s));
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
      return this.quoteFor(this.today, this.day().weather);
    },

    // ---------- silnik kroków ----------
    start(kind, key) {
      const def = kind === "exercise" ? EXERCISES[key] : RITUALS[key];
      const answers = {};
      if (kind === "ritual" && key === "poranek" && this.day().weather) answers.weather = this.day().weather;
      this.run = { kind, key, def, i: 0, answers, done: false };
      this.enterStep();
    },
    enterStep() {
      const st = this.step();
      if (st.type === "scale" && this.run.answers[st.id] == null) this.run.answers[st.id] = 5;
      if (st.type === "timer") this.startTimer(st.seconds);
      window.scrollTo(0, 0);
    },
    visibleSteps() {
      if (!this.run) return [];
      const day = this.day();
      return this.run.def.steps.filter((st) => !st.showIf || st.showIf(this.run.answers, day));
    },
    step() {
      return this.visibleSteps()[this.run.i];
    },
    stepText(field) {
      const st = this.step();
      return st ? resolve(st[field], this.run.answers, this.day()) : "";
    },
    progress() {
      return ((this.run.i + 1) / this.visibleSteps().length) * 100;
    },
    canNext() {
      const st = this.step();
      const v = this.run.answers[st.id];
      if (st.type === "weather" || st.type === "choice") return !!v;
      if (st.type === "lines") return this.lines(v).length > 0;
      if (st.type === "classify") {
        const items = this.lines(this.run.answers[st.from]);
        return items.every((it) => (v || {})[it]);
      }
      if (st.type === "timer") return !this.timer;
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
      this.run = null;
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
      if (kind === "exercise") {
        this.s.entries.unshift({
          id: Date.now().toString(36),
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
      return String(v);
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
      return [...ex, ...evenings].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 40);
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
