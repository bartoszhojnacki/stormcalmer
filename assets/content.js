// Treści aplikacji: pogody, cytaty, ćwiczenia. Logika jest w app.js.
// Cytaty to przekład własny (swobodny) z tekstów w domenie publicznej.

// sky: [góra, środek, horyzont], sea: kolor wody, amp: wysokość fal
const WEATHERS = [
  { id: "pogodnie", label: "Pogodnie", hint: "spokój, jest przestrzeń",
    sky: ["#233668", "#6c5a8e", "#e0a07a"], sea: "#22325c", amp: 0.45 },
  { id: "mgla",     label: "Mgła",     hint: "odkładanie, apatia",
    sky: ["#373e4c", "#646c7c", "#a4a9b2"], sea: "#454d5c", amp: 0.35 },
  { id: "wichura",  label: "Wichura",  hint: "niepokój, gonitwa myśli",
    sky: ["#171b3a", "#38346b", "#7468a3"], sea: "#1c1e44", amp: 1.15 },
  { id: "burza",    label: "Burza",    hint: "złość, rozdrażnienie",
    sky: ["#090c18", "#191f35", "#39405d"], sea: "#0b1221", amp: 1.6 },
  { id: "deszcz",   label: "Deszcz",   hint: "smutek, przygnębienie",
    sky: ["#16232f", "#2b4357", "#5a778e"], sea: "#132535", amp: 0.8 },
];
const DEFAULT_SKY = { id: "default", sky: ["#111930", "#29345c", "#566592"], sea: "#0d1830", amp: 0.7 };

// Które ćwiczenia polecać przy jakiej pogodzie (kolejność = priorytet).
const RECOMMEND = {
  pogodnie: ["zgory", "kontrola"],
  mgla:     ["krok", "kontrola"],
  wichura:  ["kontrola", "zgory", "zapis"],
  burza:    ["pauza", "zapis", "kontrola"],
  deszcz:   ["dobre", "zapis", "zgory"],
};

const QUOTES = [
  { t: "Jedne rzeczy zależą od nas, inne nie.", a: "Epiktet", s: "Encheiridion 1", w: ["wichura", "burza", "pogodnie"],
    q: "Co z tego, co dziś zajmuje Twoją głowę, naprawdę zależy od Ciebie?" },
  { t: "Ludzi niepokoją nie rzeczy, lecz ich mniemania o rzeczach.", a: "Epiktet", s: "Encheiridion 5", w: ["wichura", "burza", "deszcz"],
    q: "Jaki osąd dokładasz dziś do faktów?" },
  { t: "Częściej się boimy, niż cierpimy. Więcej męczy nas wyobrażenie niż rzeczywistość.", a: "Seneka", s: "Listy do Lucyliusza 13", w: ["wichura"],
    q: "Który z Twoich obecnych lęków istnieje na razie tylko w wyobraźni?" },
  { t: "Bądź jak cypel, o który bez końca rozbijają się fale. On stoi, a wokół niego cichnie wzburzona woda.", a: "Marek Aureliusz", s: "Rozmyślania IV.49", w: ["wichura", "burza", "pogodnie"],
    q: "Co dziś byłoby Twoją skałą?" },
  { t: "Od rana mów sobie: spotkam dziś ludzi wścibskich, niewdzięcznych, zuchwałych. Żaden z nich nie może mi zaszkodzić, bo nikt nie wciągnie mnie w to, co haniebne.", a: "Marek Aureliusz", s: "Rozmyślania II.1", w: ["burza"],
    q: "Kogo spodziewasz się dziś spotkać i jak chcesz na niego odpowiedzieć?" },
  { t: "O świcie, gdy niechętnie wstajesz, miej pod ręką myśl: budzę się do pracy człowieka.", a: "Marek Aureliusz", s: "Rozmyślania V.1", w: ["mgla"],
    q: "Jaka jedna praca jest dziś naprawdę Twoja?" },
  { t: "Największym lekarstwem na gniew jest zwłoka.", a: "Seneka", s: "O gniewie II", w: ["burza"],
    q: "Na co dziś warto odpowiedzieć dopiero jutro?" },
  { t: "O ileż bardziej bolesne są skutki gniewu niż rzeczy, które go wywołały.", a: "Marek Aureliusz", s: "Rozmyślania XI.18", w: ["burza"],
    q: "Co kosztował Cię ostatni wybuch, a co sama sprawa?" },
  { t: "Nie otrzymujemy życia krótkiego, lecz sami czynimy je takim.", a: "Seneka", s: "O krótkości życia 1", w: ["mgla"],
    q: "Na co dziś przecieka Twój czas?" },
  { t: "Gdy odkładamy, życie przebiega obok.", a: "Seneka", s: "Listy do Lucyliusza 1", w: ["mgla"],
    q: "Co odkładasz od dawna i jaki byłby pierwszy, śmiesznie mały krok?" },
  { t: "Nie żądaj, by rzeczy działy się tak, jak chcesz. Chciej, by działy się tak, jak się dzieją, a będzie ci dobrze.", a: "Epiktet", s: "Encheiridion 8", w: ["wichura", "deszcz"],
    q: "Z czym dziś walczysz, choć to już się wydarzyło?" },
  { t: "Jeśli smuci cię coś zewnętrznego, to nie ono cię dręczy, lecz twój sąd o nim. A ten możesz w każdej chwili odłożyć.", a: "Marek Aureliusz", s: "Rozmyślania VIII.47", w: ["deszcz", "wichura"],
    q: "Jak brzmi ten sąd, gdy zapiszesz go wprost?" },
  { t: "Doskonałość charakteru: przeżywać każdy dzień jak ostatni, bez gorączki, bez odrętwienia, bez udawania.", a: "Marek Aureliusz", s: "Rozmyślania VII.69", w: ["pogodnie", "mgla"],
    q: "Gdzie dziś udajesz, a gdzie się odrętwiasz?" },
  { t: "Przestaniesz się bać, gdy przestaniesz mieć nadzieję. Jedno i drugie wybiega myślą w przyszłość.", a: "Seneka", s: "Listy do Lucyliusza 5", w: ["wichura"],
    q: "Co się dzieje, gdy wracasz uwagą do tej chwili?" },
  { t: "Nigdzie człowiek nie znajdzie cichszego schronienia niż we własnej duszy.", a: "Marek Aureliusz", s: "Rozmyślania IV.3", w: ["wichura", "pogodnie"],
    q: "Gdzie i kiedy dziś znajdziesz minutę ciszy?" },
  { t: "Wszechświat jest zmianą, życie mniemaniem.", a: "Marek Aureliusz", s: "Rozmyślania IV.3", w: ["deszcz", "pogodnie"],
    q: "Które mniemanie o sobie warto dziś zmienić?" },
  { t: "Musisz zmienić duszę, nie klimat.", a: "Seneka", s: "Listy do Lucyliusza 28", w: ["deszcz", "mgla", "pogodnie"],
    q: "Od czego próbujesz uciec zmianą otoczenia?" },
  { t: "Nie rozprawiaj już o tym, jaki powinien być dobry człowiek. Bądź nim.", a: "Marek Aureliusz", s: "Rozmyślania X.16", w: ["mgla", "pogodnie"],
    q: "Jaki jeden czyn dziś zamiast rozmyślania?" },
  { t: "Wyznacz sobie kilka dni, w których zadowolisz się byle jakim jedzeniem i szorstkim ubraniem, i zapytaj: czy tego się bałem?", a: "Seneka", s: "Listy do Lucyliusza 18", w: ["pogodnie"],
    q: "Jaki mały dyskomfort możesz dziś wybrać dobrowolnie?" },
  { t: "Najlepszą zemstą jest nie stać się podobnym do krzywdziciela.", a: "Marek Aureliusz", s: "Rozmyślania VI.6", w: ["burza"],
    q: "Jak wyglądałaby odpowiedź, z której będziesz dumny za tydzień?" },
  { t: "Pamiętaj: nie obraża cię ten, kto ci złorzeczy, lecz twoje mniemanie, że cię obraża.", a: "Epiktet", s: "Encheiridion 20", w: ["burza"],
    q: "Co by zostało z tej obrazy bez Twojego osądu?" },
  { t: "Dwie rzeczy trzeba odciąć: lęk przed tym, co będzie, i pamięć dawnych przykrości.", a: "Seneka", s: "Listy do Lucyliusza 78", w: ["wichura", "deszcz"],
    q: "Która z nich ciąży Ci dziś bardziej?" },
  { t: "Niech cię nie niepokoi wyobrażenie całego życia. Przy każdej sprawie pytaj: co w niej jest nie do zniesienia?", a: "Marek Aureliusz", s: "Rozmyślania VIII.36", w: ["wichura"],
    q: "Co w tej jednej chwili jest naprawdę nie do zniesienia?" },
  { t: "Filozofia uczy działać, nie mówić.", a: "Seneka", s: "Listy do Lucyliusza 20", w: ["mgla"],
    q: "Co dziś zrobisz, zamiast o tym myśleć?" },
  { t: "Niech cię nie niepokoi przyszłość. Dojdziesz do niej, jeśli trzeba, z tym samym rozumem, którego używasz teraz.", a: "Marek Aureliusz", s: "Rozmyślania VII.8", w: ["wichura"],
    q: "Z czym już sobie kiedyś poradziłeś, choć wyglądało gorzej?" },
  { t: "Kto jest wszędzie, nie jest nigdzie.", a: "Seneka", s: "Listy do Lucyliusza 2", w: ["mgla", "wichura"],
    q: "Na czym jednym skupisz się w najbliższej godzinie?" },
  { t: "Wystarczy ci obecny sąd zgodny z prawdą, obecne działanie dla wspólnego dobra i obecna zgoda na to, co przynosi los.", a: "Marek Aureliusz", s: "Rozmyślania IX.6", w: ["pogodnie", "wichura"],
    q: "Co jest prawdą o tej chwili, bez dopowiadania?" },
  { t: "Muszę umrzeć. Ale czy muszę przy tym jęczeć?", a: "Epiktet", s: "Rozmowy I.1", w: ["deszcz"],
    q: "Na co wpływu nie masz, a na co masz — na swój ton?" },
  { t: "Odrzuć mniemanie, a odrzucisz „skrzywdzono mnie”. Odrzuć „skrzywdzono mnie”, a znika krzywda.", a: "Marek Aureliusz", s: "Rozmyślania IV.7", w: ["burza", "deszcz"],
    q: "Jaką historię opowiadasz sobie o tym, co się stało?" },
  { t: "Każdy kocha siebie bardziej niż innych, a jednak bardziej ceni cudze zdanie o sobie niż własne.", a: "Marek Aureliusz", s: "Rozmyślania XII.4", w: ["deszcz", "wichura"],
    q: "Czyja ocena waży dziś za dużo?" },
  { t: "Każdą rzecz rób tak, jakby była ostatnią w twoim życiu.", a: "Marek Aureliusz", s: "Rozmyślania II.5", w: ["mgla", "pogodnie"],
    q: "Co zmieniłoby się w następnym zadaniu, gdyby było ostatnie?" },
  { t: "Gdy chcesz się rozweselić, pomyśl o zaletach tych, z którymi żyjesz.", a: "Marek Aureliusz", s: "Rozmyślania VI.48", w: ["deszcz"],
    q: "Czyja zaleta przychodzi Ci teraz do głowy?" },
  { t: "Sprawmy, by pamięć o tych, których straciliśmy, stała się dla nas przyjemna.", a: "Seneka", s: "Listy do Lucyliusza 63", w: ["deszcz"],
    q: "Jakie dobre wspomnienie możesz dziś przywołać?" },
  { t: "Nie ma pomyślnego wiatru dla tego, kto nie wie, do którego portu płynie.", a: "Seneka", s: "Listy do Lucyliusza 71", w: ["mgla", "pogodnie"],
    q: "Jaki jest Twój port na ten tydzień?" },
  { t: "Gdy zgaśnie światło, przeglądam cały swój dzień i ważę swoje czyny i słowa. Niczego przed sobą nie ukrywam.", a: "Seneka", s: "O gniewie III.36", w: ["pogodnie"],
    q: "Co dziś wieczorem zobaczysz, przeglądając dzień?" },
];

const DISTORTIONS = [
  { id: "katastrofizacja", label: "Katastrofizacja",          d: "Zakładam najgorszy możliwy scenariusz." },
  { id: "czarnobiale",     label: "Czarno-białe myślenie",    d: "Wszystko albo nic, sukces albo porażka." },
  { id: "czytanie",        label: "Czytanie w myślach",       d: "Zakładam, że wiem, co myślą inni." },
  { id: "wrozenie",        label: "Przepowiadanie",           d: "Jestem pewien, jak to się skończy." },
  { id: "uogolnianie",     label: "Nadmierne uogólnianie",    d: "„Zawsze”, „nigdy”, „wszyscy”." },
  { id: "etykiety",        label: "Etykietowanie",            d: "„Jestem beznadziejny” zamiast „popełniłem błąd”." },
  { id: "powinnosci",      label: "Powinności",               d: "„Powinienem”, „muszą”, „nie wolno im”." },
  { id: "personalizacja",  label: "Personalizacja",           d: "To moja wina albo to przeciwko mnie." },
  { id: "filtr",           label: "Negatywny filtr",          d: "Widzę tylko to, co poszło źle." },
  { id: "emocje",          label: "Rozumowanie emocjonalne",  d: "Czuję to, więc to prawda." },
  { id: "dyskwalifikacja", label: "Pomijanie pozytywów",      d: "Dobre rzeczy „się nie liczą”." },
];

const CONTROL_OPTIONS = [
  { v: "tak",  label: "Zależy ode mnie" },
  { v: "czesc", label: "Częściowo" },
  { v: "nie",  label: "Nie zależy" },
];

const itemsBy = (a, value) =>
  Object.entries(a.split || {}).filter(([, v]) => value.includes(v)).map(([k]) => k);

const bullet = (arr) => arr.map((x) => "• " + x).join("\n");

// Ćwiczenia jako sekwencje kroków. Typy kroków:
//   info, text, textarea, scale, choice, multi, lines, classify, timer,
//   weather, quote, habits (dwa ostatnie tylko w rytuałach).
// prompt/hint mogą być funkcją (answers) => string; showIf: (answers) => bool.
const EXERCISES = {
  kontrola: {
    title: "Dychotomia kontroli", mins: 3,
    desc: "Rozłóż to, co Cię męczy, na Twoje i nie Twoje.",
    steps: [
      { id: "before", type: "scale", label: "Napięcie przed", prompt: "Jak silny jest teraz niepokój?" },
      { type: "info", prompt: "Epiktet zaczyna swój podręcznik od jednego zdania: jedne rzeczy zależą od nas, inne nie. Rozłóżmy to, co Cię teraz męczy, na te dwie kupki." },
      { id: "worries", type: "lines", label: "Co męczy", prompt: "Wypisz, co Cię teraz niepokoi.", hint: "Jedna rzecz w linii. Krótko." },
      { id: "split", type: "classify", from: "worries", options: CONTROL_OPTIONS, label: "Podział",
        prompt: "Przy każdej rzeczy zdecyduj uczciwie: czy to zależy od Ciebie?" },
      { id: "action", type: "textarea", label: "Pierwszy krok",
        showIf: (a) => itemsBy(a, ["tak", "czesc"]).length > 0,
        prompt: (a) => "Na to masz wpływ:\n" + bullet(itemsBy(a, ["tak", "czesc"])) + "\n\nJaki jest jeden najmniejszy krok, który możesz zrobić dziś?",
        hint: "Przy „częściowo” zajmij się tylko swoją częścią: przygotowaniem, wysiłkiem, reakcją. Wynik nie jest Twój." },
      { type: "info",
        showIf: (a) => itemsBy(a, ["nie"]).length > 0,
        prompt: (a) => "To nie zależy od Ciebie:\n" + bullet(itemsBy(a, ["nie"])) + "\n\nPowiedz sobie spokojnie: „To nie jest moje do noszenia. Moje jest tylko to, jak na to odpowiem”." },
      { id: "after", type: "scale", label: "Napięcie po", prompt: "Jak silny jest niepokój teraz?" },
    ],
  },

  zapis: {
    title: "Zapis myśli", mins: 5,
    desc: "Klasyka CBT: złap myśl, sprawdź ją jak sędzia, znajdź lepszą.",
    steps: [
      { id: "before", type: "scale", label: "Emocja przed", prompt: "Jak silna jest emocja?" },
      { id: "situation", type: "textarea", label: "Sytuacja", prompt: "Co się stało?", hint: "Same fakty, tak jak nagrałaby je kamera." },
      { id: "emotion", type: "text", label: "Emocja", prompt: "Co czujesz?", hint: "Jedno, dwa słowa: lęk, złość, wstyd, smutek…" },
      { id: "thought", type: "textarea", label: "Myśl automatyczna", prompt: "Jaka myśl przebiegła Ci przez głowę?", hint: "Zapisz ją dosłownie, nawet jeśli brzmi przesadnie." },
      { id: "distortions", type: "multi", label: "Zniekształcenia", options: DISTORTIONS,
        prompt: "Czy w tej myśli widać któreś z typowych zniekształceń?", hint: "Zaznacz tyle, ile pasuje. Żadne to też odpowiedź." },
      { id: "evidenceFor", type: "textarea", label: "Za", prompt: "Co przemawia ZA tą myślą?", hint: "Fakty, nie odczucia." },
      { id: "evidenceAgainst", type: "textarea", label: "Przeciw", prompt: "Co przemawia PRZECIW?", hint: "Co powiedziałbyś przyjacielowi, który myśli to samo?" },
      { id: "alternative", type: "textarea", label: "Myśl zrównoważona", prompt: "Napisz myśl bardziej zrównoważoną.", hint: "Ma być prawdziwa, nie tylko pozytywna." },
      { id: "after", type: "scale", label: "Emocja po", prompt: "Jak silna jest emocja teraz?" },
    ],
  },

  pauza: {
    title: "Pauza Seneki", mins: 3,
    desc: "Na złość: najpierw zwłoka, potem wybór odpowiedzi.",
    steps: [
      { id: "before", type: "scale", label: "Złość przed", prompt: "Jak silna jest złość?" },
      { type: "info", prompt: "Seneka: największym lekarstwem na gniew jest zwłoka.\n\nNic nie mów, nic nie wysyłaj. Najpierw minuta oddechu." },
      { type: "timer", seconds: 60, prompt: "Wdech na 4, wydech na 6. Wydech dłuższy niż wdech uspokaja ciało." },
      { id: "trigger", type: "textarea", label: "Fakt", prompt: "Co dokładnie Cię ruszyło?", hint: "Opisz fakt, bez ocen." },
      { id: "control", type: "choice", label: "Czy zależy ode mnie", options: CONTROL_OPTIONS, prompt: "Czy to, co Cię rozgniewało, zależy od Ciebie?" },
      { id: "judgement", type: "textarea", label: "Dołożony osąd", prompt: "Jaki osąd dołożyłeś do faktu?",
        hint: "Np. „on mnie lekceważy”, „to niesprawiedliwe”. Epiktet: nie obraża cię ten, kto złorzeczy, lecz twoje mniemanie." },
      { id: "response", type: "textarea", label: "Wybrana odpowiedź", prompt: "Jaką odpowiedź wybierasz?", hint: "„Nic nie robię” i „wracam do tego jutro” to też odpowiedzi." },
      { id: "after", type: "scale", label: "Złość po", prompt: "Jak silna jest złość teraz?" },
    ],
  },

  krok: {
    title: "Najmniejszy krok", mins: 2,
    desc: "Na mgłę i odkładanie: zrób wersję tak małą, że aż śmieszną.",
    steps: [
      { id: "before", type: "scale", label: "Opór przed", prompt: "Jak duży jest opór?" },
      { id: "task", type: "text", label: "Odkładane", prompt: "Co odkładasz?" },
      { id: "feeling", type: "choice", label: "Pod spodem", prompt: "Co czujesz, gdy o tym myślisz?",
        options: [
          { v: "przytloczenie", label: "Przytłoczenie, to za duże" },
          { v: "niejasne", label: "Nie wiem, od czego zacząć" },
          { v: "ocena", label: "Lęk przed oceną, że wyjdzie słabo" },
          { v: "nuda", label: "Nuda, zero sensu" },
          { v: "zmeczenie", label: "Zmęczenie" },
        ] },
      { type: "info", prompt: (a) => ({
          przytloczenie: "Nie musisz zrobić całości. Musisz zrobić następny kawałek. Całość to tylko suma kawałków.",
          niejasne: "Zacznij od pierwszego fizycznego ruchu: otwórz plik, weź kartkę, wpisz tytuł. Jasność przychodzi w trakcie, nie przed.",
          ocena: "Zrób celowo słabą wersję. Pierwszy szkic ma prawo być zły, od tego jest pierwszy.",
          nuda: "Zapytaj: komu albo czemu to służy? Marek Aureliusz budził się „do pracy człowieka”, a nie do pracy ciekawej.",
          zmeczenie: "Może naprawdę potrzebujesz odpoczynku. Wtedy wybierz go świadomie i wyznacz godzinę powrotu. Odpoczynek to nie ucieczka.",
        }[a.feeling] || "Wybierz najmniejszą wersję i zacznij.") },
      { id: "step", type: "text", label: "Wersja na 2 minuty", prompt: "Jaka jest wersja na 2 minuty?", hint: "Nie „napisać raport”, tylko „otworzyć plik i napisać tytuł”." },
      { id: "when", type: "choice", label: "Kiedy", prompt: "Kiedy?",
        options: [{ v: "teraz", label: "Teraz" }, { v: "godzina", label: "W ciągu godziny" }, { v: "wieczor", label: "Dziś wieczorem" }] },
      { type: "info", prompt: "„Filozofia uczy działać, nie mówić” (Seneka).\n\nZrób te dwie minuty. Potem wolno Ci przestać. Zwykle nie zechcesz." },
      { id: "after", type: "scale", label: "Opór po", prompt: "Jak duży jest opór teraz?" },
    ],
  },

  dobre: {
    title: "Trzy dobre rzeczy", mins: 3,
    desc: "Na deszcz: przekieruj uwagę na to, co mimo wszystko jest dobre.",
    steps: [
      { id: "before", type: "scale", label: "Ciężar przed", prompt: "Jak ciężko jest teraz?" },
      { type: "info", prompt: "Marek Aureliusz: gdy chcesz się rozweselić, pomyśl o zaletach tych, z którymi żyjesz.\n\nNie chodzi o to, żeby udawać, że nic się nie stało. Chodzi o to, żeby zobaczyć cały obraz, a nie tylko ciemny róg." },
      { id: "good", type: "textarea", label: "Trzy dobre rzeczy", prompt: "Wypisz trzy rzeczy, które dziś albo wczoraj były choć trochę dobre.", hint: "Małe się liczą: kawa, słońce, czyjś uśmiech." },
      { id: "people", type: "textarea", label: "Czyja zaleta", prompt: "Kto z Twojego otoczenia ma cechę, którą cenisz? Jaką?" },
      { id: "act", type: "text", label: "Życzliwy gest", prompt: "Jedna mała, życzliwa rzecz dla siebie albo kogoś w ciągu najbliższej godziny:" },
      { id: "after", type: "scale", label: "Ciężar po", prompt: "Jak ciężko jest teraz?" },
    ],
  },

  zgory: {
    title: "Spojrzenie z góry", mins: 2,
    desc: "Oddal się od problemu, aż nabierze właściwych rozmiarów.",
    steps: [
      { id: "before", type: "scale", label: "Napięcie przed", prompt: "Jak duża wydaje się teraz ta sprawa?" },
      { id: "issue", type: "text", label: "Sprawa", prompt: "Co Cię teraz zajmuje? Jednym zdaniem." },
      { type: "info", big: "🪑", prompt: "Zobacz siebie z boku: siedzisz tam, gdzie siedzisz, z tą myślą w głowie. Weź trzy spokojne oddechy." },
      { type: "info", big: "🏙️", prompt: "Unieś się nad dach. Widzisz ulicę, dzielnicę, setki okien. Za każdym ktoś ma dziś swoją sprawę." },
      { type: "info", big: "🗺️", prompt: "Wyżej. Cały kraj, rzeki, miasta jak światełka. Twoja sprawa jest gdzieś tam, w jednym punkcie." },
      { type: "info", big: "🌍", prompt: "Ziemia z orbity. Osiem miliardów ludzi, każdy z własną burzą. Kontynenty przesuwają się o centymetry rocznie." },
      { type: "info", big: "🌌", prompt: "Marek Aureliusz: pomyśl o całości istnienia, której jesteś drobiną, i o całości czasu, w której przypadła ci krótka chwila." },
      { id: "year", type: "choice", label: "Za rok", prompt: (a) => `„${a.issue || "Ta sprawa"}”. Czy będzie ważne za rok?`,
        options: [{ v: "nie", label: "Raczej nie" }, { v: "troche", label: "Trochę" }, { v: "tak", label: "Tak, naprawdę" }] },
      { id: "matters", type: "textarea", label: "Co naprawdę ważne", prompt: "Co w tej sprawie jest naprawdę ważne, gdy wrócisz na ziemię?", hint: "Często zostaje jedna rzecz: Twoje zachowanie." },
      { id: "after", type: "scale", label: "Napięcie po", prompt: "Jak duża wydaje się teraz?" },
    ],
  },
};

// Rytuały dnia: ten sam silnik kroków, inny zapis (do dnia, nie do dziennika).
const RITUALS = {
  poranek: {
    title: "Poranek", mins: 1.5,
    steps: [
      { id: "weather", type: "weather", prompt: "Jaka dziś pogoda w głowie?" },
      { type: "quote" },
      { id: "forecast", type: "textarea", label: "Prognoza", prompt: "Co dziś może pójść nie tak?",
        hint: "Premeditatio malorum. Jedno zdanie. Nie po to, żeby się martwić, tylko żeby nic Cię nie zaskoczyło." },
      { id: "response", type: "textarea", label: "Moja odpowiedź", prompt: "Jak chcesz wtedy zareagować?" },
      { id: "intention", type: "text", label: "Intencja", prompt: "Jaka cecha ma Cię dziś prowadzić?", hint: "Opcjonalnie. Np. cierpliwość, odwaga, uważność." },
    ],
  },
  wieczor: {
    title: "Wieczór", mins: 3,
    steps: [
      { id: "happened", type: "choice", label: "Czy prognoza się sprawdziła",
        showIf: (a, day) => !!day.forecast,
        prompt: (a, day) => `Poranna prognoza: „${day.forecast}”.\n\nCzy się sprawdziła?`,
        options: [{ v: "nie", label: "Nie" }, { v: "czesc", label: "Częściowo" }, { v: "tak", label: "Tak" }] },
      { id: "severity", type: "choice", label: "W porównaniu z wyobrażeniem",
        showIf: (a) => a.happened === "tak" || a.happened === "czesc",
        prompt: "Czy było tak źle, jak w wyobraźni?",
        options: [{ v: "lzej", label: "Lżej" }, { v: "tak_samo", label: "Tak samo" }, { v: "gorzej", label: "Gorzej" }] },
      { type: "info", prompt: "Seneka co wieczór robił przegląd dnia: „Niczego przed sobą nie ukrywam, niczego nie pomijam”. Trzy pytania, krótko." },
      { id: "bad", type: "textarea", label: "Co nie wyszło", prompt: "Co dziś nie wyszło?" },
      { id: "good", type: "textarea", label: "Co wyszło", prompt: "Co dziś Ci wyszło?" },
      { id: "missed", type: "textarea", label: "Na jutro", prompt: "Czego zabrakło? Co jutro zrobić inaczej?" },
      { type: "habits", prompt: "Nawyki na dziś" },
    ],
  },
};

const DEFAULT_HABITS = [
  { id: "h-ruch",    icon: "🚶", name: "Spacer lub ruch",     min: "5 minut na zewnątrz" },
  { id: "h-zimno",   icon: "🧊", name: "Zimny prysznic",      min: "30 sekund zimnej wody na koniec" },
  { id: "h-czytanie", icon: "📖", name: "Lektura",            min: "Jedna strona" },
  { id: "h-telefon", icon: "📵", name: "Godzina bez telefonu", min: "15 minut bez telefonu" },
];
