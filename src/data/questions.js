const questions = [
  {
    id: 1,
    question: "Zašto je vážno verovati timu?",
    options: [
      "Timovi sa visokim poverenjem ne moraju biti odgovorni jedni prema drugima",
      "Timovi sa visokim poverenjem ne zahtevaju predstavnika korisnika",
      "Projekt menadžer u tom slučaju ne mora da brine o rasporedu aktivnosti na projektu",
      "Prisustvo poverenja je u uzajamnoj vezi i pozitivno utiče na performanse tima"
    ],
    correct: 3,
    explanation: "Kada se SCRUM timu ukaže poverenje i stvorí se pogodno okruženje oko njega, tim preuzima odgovornost za svoje obaveze i ispunjava ih kako je očekivano od strane Product Owner-a i predstavnika biznisa."
  },
  {
    id: 2,
    question: "Ko ultimativno odlučuje kada tim ima dovojino posla prilikom Sprint planiranja?",
    options: [
      "Scrum master",
      "Product owner",
      "Development tim",
      "Product owner, Scrum master i Development tim glasaju da bi odredili kada je Sprint Backlog popunjen"
    ],
    correct: 2,
    explanation: "Razvojni inženjer (programer) odlučuje koju količinu posla može izvršiti u sprintu. U obzir se uzima nekoliko faktora, kao što je istorija brzine izvršavanja posla, raspoloživi kapacitet programera, itd."
  },
  {
    id: 3,
    question: "Šta programeri treba da rade ako je Product owner u više navrata prezauzet da bude dostupan?",
    options: [
      "Nastaviti sa radom, zabeležiti pretpostavke i pitati klijenta kasnije za mišljenje i ulazne informacije",
      "Poslati klijentu pisano upozorenje da će završni proizvod biti izvršen na vreme, ali možda neće ispuniti njihova očekivanja",
      "Dozvoliti Biznis analitičaru da preuzme ulogu Product Owner zastupnika",
      "Skrenuti pažnju na problem i obavestiti Scrum master-a"
    ],
    correct: 3,
    explanation: "Product Owner koji je u više navrata nedostupan Scrum timu je prepreka na koju Scrum master mora skrenuti pažnju."
  },
  // ... ovde ćeš dodati sva ostala pitanja (ukupno 100)
  // Evo još nekoliko primera:
  {
    id: 4,
    question: "Šta je najvažnije u svim scrum timovima?",
    options: [
      "A, B, C, D (Samoupravljanje, Jasne hijerarhije, Komunikacija, Stalno napredovanje)",
      "A, C, D (Samoupravljanje, Komunikacija, Stalno napredovanje)",
      "A, D (Samoupravljanje, Stalno napredovanje)",
      "A, B (Samoupravljanje, Jasne hijerarhije)"
    ],
    correct: 1,
    explanation: "Kada se SCRUM timu ukaže poverenje i stvorí se pogodno okruženje oko njega, tim preuzima odgovornost za svoje obaveze."
  },
  {
    id: 5,
    question: "Koja od sledećih nije tradicionalna Scrum aktivnost?",
    options: [
      "Planiranje Sprinta",
      "Pregled Sprinta",
      "Retrospektiva Sprinta",
      "Nedeljna provera"
    ],
    correct: 3,
    explanation: "Nedeljna provera nije preporučljiva aktivnost u Scrum-u. Dnevna provera je omogućena u formi dnevnog Scrum sastanka."
  },
  {
    id: 6,
    question: "Prilikom organizovanja timske dinamike, šta treba da radi Scrum Master?",
    options: [
      "Osnažuje članove tima u prikladnim granicama",
      "Ohrabruje stvaranje takmičarskog okruženja i lične dobiti",
      "Daje jasne direktive celom timu o tome šta i kako treba uraditi",
      "Očekuje da će članovi tima biti proaktivni i da će raditi na njihovim prioritetima i ciljevima"
    ],
    correct: 0,
    explanation: "Scrum je baziran na timskom radu. Nema pojedinačnih doprinosa. Takođe, Scrum Master ne može diktirati zadatke timu."
  },
  {
    id: 7,
    question: "Koje od sledećih su uloge u Scrum okviru?",
    options: [
      "Product Owner",
      "Projekt menadžer",
      "Lead developer",
      "Biznis analitičar"
    ],
    correct: 0,
    explanation: "Postoje tri uloge u Scrum-u – Product Owner, Scrum Master i Developeri."
  }
];

export default questions;