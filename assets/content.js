// Treści aplikacji: pogody, cytaty, ćwiczenia. Logika jest w app.js.
// Cytaty to przekład własny (swobodny) z tekstów w domenie publicznej.

// sky: [góra, środek, horyzont], sea: kolor wody, amp: wysokość fal
const WEATHERS = [
  { id: "pogodnie", label: "Pogodnie", hint: "spokój, jest przestrzeń",
    sky: ["#233668", "#6c5a8e", "#e0a07a"], sea: "#22325c", amp: 0.45 },
  { id: "mgla",     label: "Mgła",     hint: "odkładanie, apatia",
    sky: ["#2a2f39", "#4a515e", "#737a85"], sea: "#2a303a", amp: 0.35 },
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
  wichura:  ["natret", "kontrola", "zgory", "zapis"],
  burza:    ["pauza", "zapis", "kontrola"],
  deszcz:   ["dobre", "zapis", "zgory"],
};

const QUOTES = [
  { t: "Do każdego przykrego wyobrażenia mów od razu: jesteś tylko wrażeniem, a wcale nie tym, czym się wydajesz.", a: "Epiktet", s: "Encheiridion 1", w: ["wichura"],
    q: "Której myśli dziś dajesz zgodę, choć jest tylko wrażeniem?" },
  { t: "Wymaż wyobrażenie. Powstrzymaj szarpanie. Ogranicz się do chwili obecnej.", a: "Marek Aureliusz", s: "Rozmyślania VII.29", w: ["wichura", "burza"],
    q: "Co jest prawdą w tej chwili, poza tym, co podsuwa wyobraźnia?" },
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

// Rodzaje natrętnych myśli: `s` to treść do zdystansowania, `tag` to tytuł „historii”.
const INTRUSION_THEMES = [
  { v: "katastrofa", label: "że stanie się coś złego",            s: "stanie się coś złego",          tag: "katastrofa" },
  { v: "czyn",       label: "że zrobię coś złego lub głupiego",     s: "zrobię coś złego",              tag: "zły czyn" },
  { v: "zdrowie",    label: "o zdrowiu",                           s: "coś jest nie tak z moim zdrowiem", tag: "choroba" },
  { v: "bliscy",     label: "o bliskich",                          s: "coś stanie się bliskim",        tag: "bliscy" },
  { v: "watpliwosc", label: "wątpliwość: czy na pewno…",           s: "coś zostało zrobione źle",      tag: "wątpliwość" },
  { v: "ocena",      label: "że ze mną jest coś nie tak",          s: "ze mną jest coś nie tak",       tag: "ocena siebie" },
  { v: "obraz",      label: "obraz albo scena, która wraca",       s: "znowu ten obraz",               tag: "obraz" },
  { v: "inna",       label: "inna, nie chcę jej nazywać",          s: "ta myśl",                       tag: "ta myśl" },
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
      { id: "emotion", type: "text", label: "Emocja", prompt: "Co czujesz?", hint: "Wybierz jedną albo dwie." },
      { id: "thought", type: "textarea", label: "Myśl automatyczna", prompt: "Jaka myśl przebiegła Ci przez głowę?", hint: "Wybierz najbliższą. Może brzmieć przesadnie, tak ma być." },
      { id: "distortions", type: "multi", label: "Zniekształcenia", options: DISTORTIONS,
        prompt: "Czy w tej myśli widać któreś z typowych zniekształceń?", hint: "Zaznacz tyle, ile pasuje. Żadne to też odpowiedź." },
      { id: "evidenceFor", type: "textarea", label: "Za", prompt: "Co przemawia ZA tą myślą?", hint: "Fakty, nie odczucia." },
      { id: "evidenceAgainst", type: "textarea", label: "Przeciw", prompt: "Co przemawia PRZECIW?", hint: "Co powiedziałbyś przyjacielowi, który myśli to samo?" },
      { id: "alternative", type: "textarea", label: "Myśl zrównoważona", prompt: "Która myśl jest bardziej zrównoważona?", hint: "Dobrana do zaznaczonych zniekształceń. Ma być prawdziwa, nie tylko pozytywna." },
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

  natret: {
    title: "Natrętna myśl", mins: 3,
    desc: "Gdy wraca myśl, która nie chce odejść. Bez kłótni z nią.",
    steps: [
      { id: "before", type: "scale", label: "Natarczywość przed", prompt: "Jak bardzo ta myśl się teraz narzuca?" },
      { type: "info", prompt: "Natrętne myśli ma prawie każdy. W badaniu w 13 krajach ponad 9 na 10 osób miało je w ostatnich miesiącach.\n\nMyśl to nie zamiar, nie przepowiednia i nie prawda o Tobie. Dziś nie będziemy się z nią kłócić, bo kłótnia ją karmi." },
      { id: "theme", type: "choice", label: "Rodzaj myśli", prompt: "O czym jest ta myśl?", hint: "Nie musisz jej zapisywać ani powtarzać. Wystarczy rodzaj.",
        options: INTRUSION_THEMES },
      { type: "info", prompt: "Epiktet do każdego przykrego wyobrażenia mówił: „jesteś tylko wrażeniem, a wcale nie tym, czym się wydajesz”.\n\nWrażenie przychodzi samo. Zgoda na nie należy do Ciebie." },
      { id: "defuse", type: "defuse", label: "Dystans", prompt: "Odsuń ją od siebie, krok po kroku.", hint: "Stuknij „odsuń”, aż zdanie zrobi się małe." },
      { id: "returns", type: "stream", label: "Powroty", prompt: "Połóż ją na fali.",
        hint: "Za każdym razem, gdy wróci, stuknij falę i patrz, jak odpływa. Powroty są normalne, nie musisz jej zatrzymywać." },
      { id: "urge", type: "choice", label: "Odruch", prompt: "Co Cię ciągnie, żeby się jej pozbyć?",
        options: [
          { v: "sprawdzic", label: "sprawdzić, upewnić się" },
          { v: "pytac", label: "zapytać kogoś, czy wszystko w porządku" },
          { v: "analizowac", label: "przemyśleć to jeszcze raz, do końca" },
          { v: "odpychac", label: "odepchnąć ją, zająć głowę" },
          { v: "nic", label: "nic, po prostu jest" },
        ] },
      { type: "info", prompt: (a) => ({
          sprawdzic: "Sprawdzanie daje ulgę na chwilę, a potem myśl wraca silniejsza. Każde sprawdzenie uczy mózg, że była groźna.",
          pytac: "Pytanie innych o zapewnienie działa jak sprawdzanie: krótka ulga, dłuższa pętla.",
          analizowac: "Rozbieranie myśli na części to też kłótnia z nią. Tej myśli nie da się wygrać argumentami, bo to nie problem do rozwiązania.",
          odpychac: "Im mocniej odpychasz myśl, tym częściej wraca. Pomaga, paradoksalnie, pozwolić jej być.",
          nic: "Dobrze. Pozwól jej być w tle, jak radiu grającemu w innym pokoju.",
        }[a.urge] || "") + "\n\nSpróbuj przez 15 minut nie robić niczego, żeby ją uciszyć. Myśl może zostać. Nie musi zniknąć, żeby dało się żyć dalej." },
      { id: "next", type: "choice", label: "Co dalej", prompt: "Co teraz?",
        options: [
          { v: "wracam", label: "wracam do tego, co było przed chwilą" },
          { v: "cialo", label: "coś dla ciała: spacer, woda, rozciąganie" },
          { v: "odkladam", label: "odkładam ją na wieczór" },
        ] },
      { type: "info", showIf: (a) => a.next === "odkladam",
        prompt: "Wieczorem, przy przeglądzie, możesz do niej wrócić na 10 minut. Często okaże się, że nie ma już po co." },
      { id: "after", type: "scale", label: "Natarczywość po", prompt: "Jak bardzo narzuca się teraz?",
        hint: "Celem nie jest zero. Celem jest to, że myśl może być, a Ty i tak robisz swoje." },
      { type: "info", prompt: "Jeśli takie myśli zajmują Ci dużo czasu każdego dnia, warto porozmawiać ze specjalistą. Najlepiej przebadana metoda to terapia poznawczo-behawioralna z ekspozycją (ERP)." },
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
      { id: "forecast", type: "text", label: "Prognoza", prompt: "Gdzie dziś może zawiać?",
        hint: "Jedna sytuacja, która może Cię wytrącić. Stuknij albo wpisz słowo." },
      { id: "response", type: "text", label: "Moja odpowiedź",
        prompt: (a) => a.forecast ? `Gdy przyjdzie „${a.forecast}”, co zrobisz?` : "Gdy zawieje, co zrobisz?" },
      { id: "intention", type: "text", label: "Intencja", prompt: "Jedno słowo na dziś?", hint: "Cecha, która ma Cię prowadzić. Można pominąć." },
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

// ---------- Onboarding ----------

// Propozycje nawyków: kotwica (po czym?) + wersja minimum. `for` = przy jakich burzach polecać.
const HABIT_SUGGESTIONS = [
  { id: "s-oddech",  name: "Trzy spokojne oddechy",       min: "jeden oddech",              anchor: "zaraz po obudzeniu",        for: ["wichura"] },
  { id: "s-spacer",  name: "Spacer bez telefonu",         min: "5 minut na zewnątrz",       anchor: "po obiedzie",               for: ["wichura", "deszcz"] },
  { id: "s-pauza",   name: "Pauza przed odpowiedzią",     min: "policzyć do pięciu",        anchor: "zanim odpiszę na trudną wiadomość", for: ["burza"] },
  { id: "s-ruch",    name: "Ruch, który zmęczy",          min: "10 przysiadów",             anchor: "po pracy",                  for: ["burza", "mgla"] },
  { id: "s-start",   name: "Dwie minuty najtrudniejszego", min: "otworzyć plik",            anchor: "po pierwszej kawie",        for: ["mgla"] },
  { id: "s-plan",    name: "Plan dnia na kartce",         min: "jedna najważniejsza rzecz", anchor: "przy porannej kawie",       for: ["mgla", "wichura"] },
  { id: "s-swiatlo", name: "Światło dzienne",             min: "5 minut przy oknie",        anchor: "przed południem",           for: ["deszcz"] },
  { id: "s-bliscy",  name: "Wiadomość do bliskiej osoby", min: "jedno zdanie",              anchor: "w drodze do domu",          for: ["deszcz"] },
  { id: "s-lektura", name: "Lektura",                     min: "jedna strona",              anchor: "przed snem",                for: [] },
  { id: "s-zimno",   name: "Zimny prysznic",              min: "30 sekund zimnej wody",     anchor: "na koniec prysznica",       for: [] },
];

const BASELINE_ITEMS = [
  { id: "anx",    label: "Niepokój",          ends: ["spokój", "ciągły"] },
  { id: "anger",  label: "Rozdrażnienie",     ends: ["łagodność", "wybuchy"] },
  { id: "energy", label: "Energia",           ends: ["pusto", "pełno"] },
];

const FLOWS = {
  onboarding: {
    title: "Pierwszy rejs", mins: 3,
    steps: [
      { type: "intro", prompt: "Każdego dnia sprawdzasz pogodę w głowie.",
        hint: "Nie wybierasz jej. Możesz się na nią przygotować i wiedzieć, co robić, gdy nadciąga burza. Na tym polega cała ta aplikacja." },
      { id: "storms", type: "storms", label: "Najczęstsze burze", prompt: "Jakie burze odwiedzają Cię najczęściej?", hint: "Wybierz jedną albo dwie. Na tej podstawie podsunę ćwiczenia i nawyki." },
      { id: "goal", type: "textarea", label: "Port", prompt: "Co chcesz, żeby było inaczej za miesiąc?",
        hint: "Seneka: nie ma pomyślnego wiatru dla tego, kto nie wie, do którego portu płynie.\nWłasnymi słowami. Przypomnę Ci to w gorszy dzień." },
      { id: "baseline", type: "baseline", label: "Punkt wyjścia", prompt: "Jak było przez ostatnie dwa tygodnie?",
        hint: "To nie test. Za dwa tygodnie zapytam ponownie, żeby było widać, co się zmienia." },
      { id: "habits", type: "habitPick", label: "Nawyki", prompt: "Wybierz do trzech nawyków.",
        hint: "Mniej znaczy więcej. Każdy ma kotwicę (po czym go robisz) i wersję minimum na gorszy dzień." },
      { id: "rhythm", type: "rhythm", label: "Rytm", prompt: "Kiedy chcesz zaglądać?",
        hint: "Rano na 1,5 minuty, wieczorem na 3." },
      { type: "info", prompt: (a) => `Gotowe. Zaczynamy od razu: ${new Date().getHours() < 16 ? "Twój pierwszy poranek" : "Twój pierwszy wieczór"}.`,
        hint: "Przez pierwsze dwa tygodnie na ekranie Dziś będzie czekać jedna mała karta dziennie. Każdą możesz pominąć." },
    ],
  },
  checkin: {
    title: "Punkt kontrolny", mins: 1,
    steps: [
      { id: "baseline", type: "baseline", label: "Teraz", prompt: "Jak było przez ostatnie dwa tygodnie?",
        hint: "Te same trzy pytania co na początku. Odpowiadaj szczerze, bez zaglądania do poprzednich." },
    ],
  },
};

// Karty pierwszych tygodni: `day` = dni od onboardingu. `go` = co uruchamia przycisk.
const JOURNEY = [
  { id: "j-pauza",  day: 1,  title: "Przećwicz burzę na spokojnie", body: "W burzy nikt nie uczy się nowych rzeczy. Zrób pauzę Seneki teraz, kiedy jest cicho, żeby w trudnej chwili mieć ją w ciele.", go: ["exercise", "pauza"], cta: "Zacznij · 3 min" },
  { id: "j-zapis",  day: 2,  title: "Złap jedną myśl", body: "Zapis myśli na drobnej sprawie z wczoraj. Na niskiej stawce najłatwiej nauczyć się rozpoznawać zniekształcenia.", go: ["exercise", "zapis"], cta: "Zacznij · 5 min" },
  { id: "j-kontr",  day: 3,  title: "Twoje i nie Twoje", body: "Dychotomia kontroli: serce stoicyzmu. Rozłóż na dwie kupki to, co Cię ostatnio zajmuje.", go: ["exercise", "kontrola"], cta: "Zacznij · 3 min" },
  { id: "j-zgory",  day: 4,  title: "Spojrzenie z góry", body: "Oddal się od jednej sprawy, aż nabierze właściwych rozmiarów. Najbardziej filmowe z ćwiczeń.", go: ["exercise", "zgory"], cta: "Zacznij · 2 min" },
  { id: "j-klimat", day: 6,  title: "Pierwszy tydzień za Tobą", body: "Zajrzyj do Klimatu: ile czarnych prognoz się sprawdziło? I zrób pierwszą kopię danych, zanim jest co tracić.", go: ["tab", "klimat"], cta: "Otwórz Klimat" },
  { id: "j-check1", day: 13, title: "Punkt kontrolny", body: "Dwa tygodnie. Te same trzy pytania co na początku, żeby zobaczyć, co się zmieniło.", go: ["flow", "checkin"], cta: "Odpowiedz · 1 min" },
  { id: "j-check2", day: 29, title: "Miesiąc", body: "Wróćmy do Twojego portu i punktu wyjścia. Co się zmieniło?", go: ["flow", "checkin"], cta: "Odpowiedz · 1 min" },
];

// ---------- Podpowiedzi do pól tekstowych ----------
// Klucz: "<rytuał|ćwiczenie|flow>.<id kroku>". Podpowiedź kończąca się „…” to początek
// zdania: wstawia się do pola i czeka na dokończenie. Reszta dopisuje się jako gotowa odpowiedź.
// Do tego aplikacja dokłada 3 ostatnie własne odpowiedzi z tego samego pola.
const CHIPS = {
  "poranek.forecast": ["trudna rozmowa", "za dużo zadań", "zmęczenie", "spóźnienie", "konkretny człowiek", "niepewna sprawa", "spotkanie", "termin", "krytyka", "czekanie na odpowiedź", "korki", "hałas", "mało snu", "zła wiadomość", "niechęć do pracy", "decyzja do podjęcia", "telefon, którego nie chcę", "pieniądze", "zdrowie", "czyjś zły humor", "coś nie zadziała", "presja czasu", "tłum ludzi", "wieczór sam ze sobą", "trudny mail", "ocena mojej pracy"],
  "poranek.response": ["pauza, zanim odpowiem", "zrobię swoje, wynik nie jest mój", "zapytam, zamiast zakładać", "jedna rzecz naraz", "odpuszczę, co nie moje", "trzy oddechy", "odpowiem jutro", "nazwę to, co czuję", "krótki spacer", "powiem wprost, czego potrzebuję", "przypomnę sobie, że to minie", "2 minuty i zobaczę", "poproszę o pomoc", "wyciszę telefon", "zapiszę to na później", "spojrzę z góry", "potraktuję to jak ćwiczenie", "łagodność wobec siebie", "wysłucham do końca", "nie muszę mieć racji"],
  "poranek.intention": ["cierpliwość", "odwaga", "spokój", "uważność", "życzliwość", "wytrwałość", "prostota", "wdzięczność", "umiar", "szczerość", "ciekawość", "pokora", "skupienie", "łagodność", "sprawiedliwość", "odpuszczanie", "dyscyplina", "pogoda ducha", "obecność", "hojność"],
  "wieczor.bad": ["nerwy", "odkładanie", "za dużo telefonu", "zmęczenie", "nic szczególnego", "ostre słowa", "zamartwianie się", "za dużo naraz", "brak przerwy", "nieuważność", "podjadanie", "za późno spać", "unikanie rozmowy", "perfekcjonizm", "narzekanie", "porównywanie się", "pośpiech", "niesłuchanie", "rozproszenie", "zakupy pod wpływem chwili"],
  "wieczor.good": ["trudna rzecz zrobiona", "cierpliwość", "ruch", "dobra rozmowa", "odpoczynek", "dotrzymane słowo", "pomoc komuś", "spokojna reakcja", "skupiona praca", "czas z bliskimi", "dobre jedzenie", "świeże powietrze", "coś nowego", "odmowa, gdy trzeba", "lektura", "porządek", "pauza przed reakcją", "śmiech", "chwila ciszy", "zrobione minimum"],
  "wieczor.missed": ["snu", "ruchu", "przerwy", "rozmowy", "skupienia", "niczego, było dobrze", "cierpliwości", "czasu dla siebie", "wody", "odwagi", "granic", "światła dziennego", "natury", "planu", "odpoczynku od ekranu", "czułości", "odpuszczenia", "wdzięczności"],

  "kontrola.worries": ["praca", "zdrowie", "pieniądze", "relacje", "czyjaś opinia", "przyszłość"],
  "kontrola.action": ["10 minut przygotowania", "jedna wiadomość", "zapytam, zamiast zgadywać", "zapiszę plan na kartce", "dziś nic, jutro rano"],
  "zapis.situation": ["w pracy", "w domu", "w drodze", "wiadomość / telefon", "rozmowa z kimś", "sam ze swoimi myślami"],
  "zapis.emotion": ["lęk", "złość", "wstyd", "smutek", "frustracja", "bezradność", "zazdrość"],
  "zapis.thought": ["nie dam rady", "wszystko się posypie", "zawiodę kogoś", "znowu to samo", "to moja wina", "oceniają mnie", "nie powinno tak być"],
  "zapis.evidenceFor": ["mam konkretny fakt", "tak już kiedyś było", "ktoś mi to powiedział", "to raczej przeczucie", "nie mam dowodu"],
  "zapis.evidenceAgainst": ["wcześniej dawałem radę", "nie znam całej sytuacji", "są inne wyjaśnienia", "to się jeszcze nie wydarzyło", "przyjaciel widziałby to inaczej"],
  "zapis.alternative": (a) => [...new Set([...(a.distortions || []).map((d) => REFRAMES[d]).filter(Boolean), ...REFRAMES_GENERAL])],
  "pauza.trigger": ["czyjeś słowa", "czyjś ton", "ktoś mnie zignorował", "spóźnienie", "coś nie działa", "niesprawiedliwość"],
  "pauza.judgement": ["lekceważy mnie", "to niesprawiedliwe", "powinien był inaczej", "zawsze tak jest", "nie szanują mnie"],
  "pauza.response": ["odpowiem jutro", "nic nie robię", "powiem spokojnie, czego potrzebuję", "zapytam, co miał na myśli", "odpuszczam"],
  "krok.step": ["otworzę plik / aplikację", "napiszę jedno zdanie", "zrobię listę trzech rzeczy", "minutnik na 2 minuty", "przygotuję miejsce"],
  "krok.task": ["mail", "raport / dokument", "telefon", "porządki", "ćwiczenia", "trudna rozmowa"],
  "dobre.good": ["kawa", "słońce", "rozmowa", "ruch", "coś mi wyszło", "dobre jedzenie", "cisza"],
  "dobre.act": ["wiadomość do kogoś", "spacer", "herbata dla siebie", "komuś podziękować"],
  "zgory.issue": ["praca", "relacja", "zdrowie", "pieniądze", "czyjaś opinia", "przyszłość"],
  "zgory.matters": ["moje zachowanie", "zdrowie", "bliscy", "to, co zrobię jutro"],
  "dobre.people": ["partner / partnerka", "przyjaciel", "ktoś z pracy", "rodzic", "dziecko", "ja sam"],
  "onboarding.goal": ["mniej nerwów", "spokojniejsze wieczory", "mniej odkładania", "więcej energii", "lepszy sen"],
};

// Myśl zrównoważona dopasowana do zaznaczonych zniekształceń (zapis myśli)
const REFRAMES = {
  katastrofizacja: "Najgorsze jest możliwe, ale mało prawdopodobne. Poradzę sobie z tym, co się naprawdę wydarzy.",
  czarnobiale: "To nie jest wszystko albo nic. Coś poszło źle, coś dobrze.",
  czytanie: "Nie wiem, co myślą inni. Mogę zapytać, zamiast zgadywać.",
  wrozenie: "Nie znam przyszłości. Zobaczę, co się wydarzy, i wtedy odpowiem.",
  uogolnianie: "To jedna sytuacja, nie reguła. „Zawsze” i „nigdy” rzadko są prawdą.",
  etykiety: "Popełniłem błąd. To nie mówi, kim jestem.",
  powinnosci: "Wolałbym, żeby było inaczej, ale świat nie musi spełniać moich oczekiwań.",
  personalizacja: "Nie wszystko jest o mnie. Na to złożyło się wiele rzeczy.",
  filtr: "Widzę to, co poszło źle. Co dziś poszło dobrze?",
  emocje: "Czuję to mocno, ale uczucie to nie dowód.",
  dyskwalifikacja: "To, co mi wyszło, też się liczy.",
};
const REFRAMES_GENERAL = [
  "To trudne, ale do przejścia.",
  "Zrobię, co zależy ode mnie. Reszta nie jest moja.",
];
