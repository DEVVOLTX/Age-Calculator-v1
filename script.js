/* Age Calculator: Miladi/Hijri conversion + exact difference (Y/M/D) */

const $ = (id) => document.getElementById(id);

const birthDayEl = $("birthDay");
const birthMonthEl = $("birthMonth");
const birthYearEl = $("birthYear");
const calendarTypeEl = $("calendarType"); // unchecked => miladi, checked => hijri

const calcBtn = $("calcAge");
const clearBtn = $("clearBtn");
const setTodayBtn = $("setToday");
const todayWeekdayEl = $("todayWeekday");


const ageYearsEl = $("ageYears");
const ageMonthsEl = $("ageMonths");
const ageDaysEl = $("ageDays");
const ageSecondsEl = $("ageSeconds");

const nextBirthDaysEl = $("nextBirthDays");
const nextBirthHoursEl = $("nextBirthHours");
const nextBirthMinutesEl = $("nextBirthMinutes");
const nextBirthSecondsEl = $("nextBirthSeconds");


const birthMiladiText = $("birthMiladiText");
const birthHijriText = $("birthHijriText");
const todayMiladiText = $("todayMiladiText");
const todayHijriText = $("todayHijriText");

// New features
const zodiacSignEl = $("zodiacSign");
const generationEl = $("generation");
const historicalEventEl = $("historicalEvent");

const themeToggleBtn = $("themeToggle");
const themeLabelEl = $("themeLabel");


// ---------- Hijri <-> Miladi (Civil/Tabular approximation) ----------
// Uses widely-used arithmetic algorithm. Good for typical calculators.
// Reference approach: convert using Julian day (civil)

function toJulianDayGregorian(y, m, d) {
  // y: year, m: 1-12, d: day
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function fromJulianDayToGregorian(jd) {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function islamicToJdCivil(hy, hm, hd) {
  // hm: 1-12, hd: 1-30
  // epoch: 1 Muharram 1 AH corresponds to JD 1948439.5 (approx)
  // This algorithm uses integer JD.
  return hd +
    Math.ceil(29.5 * (hm - 1)) +
    (hy - 1) * 354 +
    Math.floor((3 + 11 * hy) / 30) +
    1948439;
}

function jdToIslamicCivil(jd) {
  const hy = Math.floor((30 * (jd - 1948439) + 10646) / 10631);
  const hm = Math.min(12, Math.ceil((jd - (29 + islamicToJdCivil(hy, 1, 1))) / 29.5) + 1);
  const hd = jd - islamicToJdCivil(hy, hm, 1) + 1;
  return { year: hy, month: hm, day: hd };
}

function hijriToGregorian({ year, month, day }) {
  const jd = islamicToJdCivil(year, month, day);
  const g = fromJulianDayToGregorian(jd);
  return g;
}

function gregorianToHijri({ year, month, day }) {
  const jd = toJulianDayGregorian(year, month, day);
  const h = jdToIslamicCivil(jd);
  return h;
}

// ---------- Age calculation (exact Y/M/D) ----------

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysInGregorianMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function addYearsMonths(date, addYears, addMonths) {
  const y = date.getFullYear() + addYears;
  const m = date.getMonth() + addMonths;
  const day = date.getDate();
  // clamp day to month length
  const targetMonthIndex = ((m % 12) + 12) % 12;
  const targetYear = y + Math.floor(m / 12);
  const maxDay = daysInGregorianMonth(targetYear, targetMonthIndex);
  return new Date(targetYear, targetMonthIndex, Math.min(day, maxDay));
}

function diffYMD(fromDate, toDate) {
  // fromDate <= toDate
  let years = toDate.getFullYear() - fromDate.getFullYear();
  let candidate = addYearsMonths(fromDate, years, 0);
  if (candidate > toDate) {
    years -= 1;
    candidate = addYearsMonths(fromDate, years, 0);
  }

  let months = toDate.getMonth() - candidate.getMonth();
  if (months < 0) months += 12;

  // Adjust months by trying to move candidate
  candidate = addYearsMonths(fromDate, years, months);
  while (candidate > toDate) {
    months -= 1;
    if (months < 0) {
      years -= 1;
      months = 11;
    }
    candidate = addYearsMonths(fromDate, years, months);
  }

  // Now candidate <= toDate
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((toDate - candidate) / msPerDay);

  return { years, months, days };
}

function formatDateAr({ year, month, day }, monthNames) {
  return `${day} ${monthNames?.[month - 1] ?? month} ${year}`;
}

const monthNamesMiladi = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const monthNamesHijri = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
  "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

function renderBirthMonthOptions() {
  // Keep values 1..12, only change displayed names.
  const monthNames = calendarTypeEl.checked ? monthNamesHijri : monthNamesMiladi;

  const currentValue = birthMonthEl.value ? String(birthMonthEl.value) : "1";

  birthMonthEl.innerHTML = monthNames
    .map((name, idx) => `<option value="${idx + 1}">${name}</option>`)
    .join("");

  // Restore selected value if possible.
  const normalized = String(Number(currentValue));
  birthMonthEl.value = normalized;
  if (!birthMonthEl.value) birthMonthEl.value = "1";
}

function getWeekdayAr(date) {
  return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
}

function showToday() {
  const now = new Date();
  const today = startOfDay(now);

  // weekday text: will be updated after calc() using the birth date
  todayWeekdayEl.textContent = "-";

  const g = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  const h = gregorianToHijri(g);

  todayMiladiText.textContent = formatDateAr(g, monthNamesMiladi);
  todayHijriText.textContent = `${h.day} ${monthNamesHijri[h.month - 1]} ${h.year}`;
}



function setInputsToToday() {
  // Ensure month select labels match current calendar type.
  renderBirthMonthOptions();

  const now = new Date();
  const today = startOfDay(now);
  const g = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  const h = gregorianToHijri(g);

  if (calendarTypeEl.checked) {
    birthDayEl.value = h.day;
    birthMonthEl.value = String(h.month);
    birthYearEl.value = h.year;
  } else {
    birthDayEl.value = g.day;
    birthMonthEl.value = String(g.month);
    birthYearEl.value = g.year;
  }
}



function parseInputs() {
  const day = Number(birthDayEl.value);
  const month = Number(birthMonthEl.value);
  const year = Number(birthYearEl.value);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (day < 1 || month < 1 || month > 12 || year < 1300) return null;
  return { day, month, year };
}

function validateGregorian({ year, month, day }) {
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

function validateHijri({ year, month, day }) {
  // Civil: months alternate 30/29; but last month can be 30 depending.
  // We'll accept day <= 30 and month 1-12.
  if (day < 1 || day > 30) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1 || year > 1600) return false;
  return true;
}

function getZodiacSignMiladi(day, month) {
  // Aries begins Mar 21
  const m = month;
  const d = day;
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "الحمل";
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "الثور";
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "الجوزاء";
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "السرطان";
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "الأسد";
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "العذراء";
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "الميزان";
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "العقرب";
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "القوس";
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "الجدي";
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "الدلو";
  return "الحوت";
}

function getGenerationByYear(year) {
  // Approx common ranges (may vary slightly by source)
  if (year >= 1997 && year <= 2012) return "الجيل Z";
  if (year >= 1981 && year <= 1996) return "جيل الألفية (Millennials)";
  if (year >= 1965 && year <= 1980) return "الجيل X (Gen X)";
  if (year >= 1946 && year <= 1964) return "طفرة مواليد (Baby Boomers)";
  if (year <= 1945) return "الجيل الصامت (Silent Generation)";
  return "-";
}

const historicalEventsByYear = {
  1945: "نهاية الحرب العالمية الثانية (استسلام ألمانيا)",
  1969: "هبوط الإنسان على سطح القمر (أبولّو 11)",
  1977: "إطلاق فوييجر 1 وفوييجر 2 نحو الفضاء",
  1989: "سقوط جدار برلين",
  1991: "تفكك الاتحاد السوفيتي",
  1998: "إطلاق خدمة Gmail (بداية العصر الرقمي الحديث)",
  2001: "هجمات 11 سبتمبر",
  2007: "إطلاق iPhone (بدء حقبة الهواتف الذكية)",
  2008: "الأزمة المالية العالمية (Great Recession)",
  2010: "انتشار الربيع العربي وموجة الاحتجاجات في المنطقة",
  2012: "إطلاق أول قمر صناعي لنظام تحديد المواقع (عمومًا وصولات كبيرة في الفضاء)",
  2016: "توقيع اتفاق باريس للمناخ (COP21)",
  2020: "بداية جائحة كوفيد-19 عالميًا"
};

function getHistoricalEventByYear(year) {
  if (historicalEventsByYear[year]) return historicalEventsByYear[year];
  // Fallback: generic world event phrase
  return `حدث عالمي مشهور في ${year} (تقريبي)`;
}

function sameYMD(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

function getNextBirthdayMiladiDate({ birthDay, birthMonth }, fromDate = new Date()) {
  const base = startOfDay(fromDate);
  const year = base.getFullYear();

  // Handle Feb 29 normalization: when not leap year => treat as Mar 1 (requested)
  const normalizedBirth = (() => {
    if (birthMonth === 2 && birthDay === 29 && !isLeapYear(year)) {
      return { day: 1, month: 3 };
    }
    return { day: birthDay, month: birthMonth };
  })();

  let candidate = startOfDay(new Date(year, normalizedBirth.month - 1, normalizedBirth.day));
  if (candidate < base) {
    const nextYear = year + 1;

    const normalizedNext = (() => {
      if (birthMonth === 2 && birthDay === 29 && !isLeapYear(nextYear)) {
        return { day: 1, month: 3 };
      }
      return { day: birthDay, month: birthMonth };
    })();

    candidate = startOfDay(new Date(nextYear, normalizedNext.month - 1, normalizedNext.day));
  }

  return candidate;
}

let __nextBirthdayInterval = null;

function stopNextBirthdayCountdown() {
  if (__nextBirthdayInterval) {
    clearInterval(__nextBirthdayInterval);
    __nextBirthdayInterval = null;
  }
}

function renderNextBirthCountdown(targetDate) {
  const tick = () => {
    const now = new Date();
    const diffMs = targetDate - now;
    const diff = diffMs <= 0 ? 0 : diffMs;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    nextBirthDaysEl.textContent = new Intl.NumberFormat('ar-EG').format(days);
    nextBirthHoursEl.textContent = new Intl.NumberFormat('ar-EG').format(hours);
    nextBirthMinutesEl.textContent = new Intl.NumberFormat('ar-EG').format(minutes);
    nextBirthSecondsEl.textContent = new Intl.NumberFormat('ar-EG').format(seconds);

    if (diffMs <= 0) {
      stopNextBirthdayCountdown();
    }
  };

  tick();
  stopNextBirthdayCountdown();
  __nextBirthdayInterval = setInterval(tick, 1000);
}



function fireBirthdayConfettiOnce() {
  try {
    if (window.__confettiFired) return;
    if (typeof confetti !== "function") return;
    window.__confettiFired = true;
    confetti({
      particleCount: 130,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2f9bff", "#ff2f55", "#00e5ff", "#ffe66d"]
    });
  } catch (e) {
    // ignore
  }
}

function persistBirthInputs(input) {
  try {
    localStorage.setItem("birthDay", String(input.day));
    localStorage.setItem("birthMonth", String(input.month));
    localStorage.setItem("birthYear", String(input.year));
    localStorage.setItem("calendarType", calendarTypeEl.checked ? "hijri" : "miladi");
  } catch (e) {
    // ignore
  }
}

function loadPersistedBirthInputs() {
  try {
    const d = localStorage.getItem("birthDay");
    const m = localStorage.getItem("birthMonth");
    const y = localStorage.getItem("birthYear");
    const ct = localStorage.getItem("calendarType");

    if (!d || !m || !y || !ct) return false;

    birthDayEl.value = d;
    birthMonthEl.value = m;
    birthYearEl.value = y;

    calendarTypeEl.checked = ct === "hijri";

    // Keep the month labels correct for the chosen calendar type.
    renderBirthMonthOptions();
    return true;
  } catch (e) {
    return false;
  }
}

function calc() {
  const input = parseInputs();
  if (!input) {
    alert("ادخل تاريخ صحيح (يوم/شهر/سنة). ");
    return;
  }

  // Persist user inputs for next visit
  persistBirthInputs(input);

  const today = startOfDay(new Date());


  // theme init (one-time)

  if (themeToggleBtn && !themeToggleBtn.dataset.inited) {
    themeToggleBtn.dataset.inited = "1";
    const saved = localStorage.getItem("theme");
    const initial = saved || "dark";
    document.documentElement.setAttribute("data-theme", initial);
    themeLabelEl.textContent = initial === "light" ? "فاتح" : "داكن";

    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      themeLabelEl.textContent = next === "light" ? "فاتح" : "داكن";
    });
  }


  let miladi;
  if (calendarTypeEl.checked) {
    // hijri input => convert to miladi
    const hijri = { year: input.year, month: input.month, day: input.day };
    if (!validateHijri(hijri)) {
      alert("تاريخ هجري غير صحيح.");
      return;
    }
    miladi = hijriToGregorian(hijri);
    if (!validateGregorian(miladi)) {
      alert("تعذر تحويل التاريخ الهجري إلى ميلادي.");
      return;
    }

    const birthHijri = hijri;
    const birthMiladi = miladi;

    birthMiladiText.textContent = formatDateAr(birthMiladi, monthNamesMiladi);
    birthHijriText.textContent = `${birthHijri.day} ${monthNamesHijri[birthHijri.month - 1]} ${birthHijri.year}`;
  } else {
    miladi = { year: input.year, month: input.month, day: input.day };
    if (!validateGregorian(miladi)) {
      alert("تاريخ ميلادي غير صحيح.");
      return;
    }
    const birthHijri = gregorianToHijri(miladi);

    birthMiladiText.textContent = formatDateAr(miladi, monthNamesMiladi);
    birthHijriText.textContent = `${birthHijri.day} ${monthNamesHijri[birthHijri.month - 1]} ${birthHijri.year}`;
  }

  const birthDate = startOfDay(new Date(miladi.year, miladi.month - 1, miladi.day));

  if (birthDate > today) {
    alert("تاريخ الميلاد لازم يكون قبل أو يساوي تاريخ اليوم.");
    return;
  }

  const { years, months, days } = diffYMD(birthDate, today);
  const seconds = Math.floor((today - birthDate) / 1000);

  // Update "لقد ولدت في يوم ..." based on birth date (miladi)
  todayWeekdayEl.textContent = getWeekdayAr(birthDate);

  ageYearsEl.textContent = years;

  ageMonthsEl.textContent = months;
  ageDaysEl.textContent = days;
  ageSecondsEl.textContent = new Intl.NumberFormat('ar-EG').format(seconds);

  // Zodiac + Generation + Historical Event
  zodiacSignEl.textContent = getZodiacSignMiladi(miladi.day, miladi.month);
  generationEl.textContent = getGenerationByYear(miladi.year);
  historicalEventEl.textContent = getHistoricalEventByYear(miladi.year);

  // Next birthday countdown (uses Miladi day+month)
  try {
    const target = getNextBirthdayMiladiDate({ birthDay: miladi.day, birthMonth: miladi.month }, new Date());
    // If the calculated date is today but in past time (midnight vs now), keep it as today => diffMs will be <=0 and show 0s.
    // We clamp at 0 anyway.
    renderNextBirthCountdown(target);
  } catch (e) {
    nextBirthDaysEl.textContent = "-";
    nextBirthHoursEl.textContent = "-";
    nextBirthMinutesEl.textContent = "-";
    nextBirthSecondsEl.textContent = "-";
  }

  // Confetti when birthday matches today (day+month+year) for Miladi
  try {
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth() + 1;
    const todayD = now.getDate();

    const birthY = miladi.year;
    const birthM = miladi.month;
    const birthD = miladi.day;

    if (birthY === todayY && birthM === todayM && birthD === todayD) {
      fireBirthdayConfettiOnce();
    }
  } catch (e) {
    // ignore
  }
}


function clearAll() {
  birthDayEl.value = "";
  birthMonthEl.value = "1";
  birthYearEl.value = "";

  // Reset calendar type UI to default miladi.
  calendarTypeEl.checked = false;
  renderBirthMonthOptions();


  // Clear persisted birth date
  try {
    localStorage.removeItem("birthDay");
    localStorage.removeItem("birthMonth");
    localStorage.removeItem("birthYear");
    localStorage.removeItem("calendarType");
  } catch (e) {
    // ignore
  }

  ageYearsEl.textContent = "-";
  ageMonthsEl.textContent = "-";
  ageDaysEl.textContent = "-";
  ageSecondsEl.textContent = "-";
  nextBirthDaysEl.textContent = "-";
  nextBirthHoursEl.textContent = "-";
  nextBirthMinutesEl.textContent = "-";
  nextBirthSecondsEl.textContent = "-";
  stopNextBirthdayCountdown();
  birthMiladiText.textContent = "-";
  birthHijriText.textContent = "-";
}



calendarTypeEl.addEventListener("change", () => {
  // Switch month label names (values remain 1..12).
  renderBirthMonthOptions();
});

// ---------- Tabs / Panels ----------
const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));

function setActiveTab(tabName) {
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isPanel = panel.dataset.panel === tabName;
    panel.hidden = !isPanel;
    if (isPanel) panel.classList.add('active');
    else panel.classList.remove('active');
  });
}

if (tabButtons.length) {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });
}

// ---------- Pet Age Calculator ----------
const petTypeEl = $("petType");
const petAgeYearsEl = $("petAgeYears");
const calcPetAgeBtn = $("calcPetAge");
const clearPetBtn = $("clearPetBtn");

const petAgeHumanEl = $("petAgeHuman");
const petAgeHumanDetailEl = $("petAgeHumanDetail");

function calcPetAgeHuman(petType, petYears) {
  const y = petYears;
  if (!Number.isFinite(y) || y < 0) return null;

  // Approx conversion (common heuristic):
  // - Dog: 1 year => 15, 2nd => 9, rest => 5.5 per year (approx)
  // - Cat: 1st => 15, rest => 4 per year (approx)
  // - Rabbit: slower growth; 1st => 10, 2nd => 8, rest => 4 per year (approx)
  const toHuman = (firstFactor, secondFactor, restFactor) => {
    if (y <= 0) return 0;
    if (y <= 1) return y * firstFactor;
    if (y <= 2) return firstFactor + (y - 1) * secondFactor;
    return firstFactor + secondFactor + (y - 2) * restFactor;
  };

  if (petType === 'dog') {
    const human = toHuman(15, 9, 5.5);
    const detail = `كلب: سنة 1 ≈ 15، سنة 2 ≈ 9، والباقي ≈ 5.5/سنة`;
    return { human, detail };
  }
  if (petType === 'cat') {
    const human = toHuman(15, 4, 4);
    const detail = `قط: سنة 1 ≈ 15، والباقي ≈ 4/سنة`;
    return { human, detail };
  }
  if (petType === 'rabbit') {
    const human = toHuman(10, 8, 4);
    const detail = `أرنب: سنة 1 ≈ 10، سنة 2 ≈ 8، والباقي ≈ 4/سنة`;
    return { human, detail };
  }

  return null;
}

function calcPetAge() {
  if (!petTypeEl || !petAgeYearsEl) return;
  const petType = petTypeEl.value;
  const petYears = Number(petAgeYearsEl.value);
  const res = calcPetAgeHuman(petType, petYears);
  if (!res) {
    petAgeHumanEl.textContent = '-';
    petAgeHumanDetailEl.textContent = '-';
    return;
  }
  petAgeHumanEl.textContent = new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(res.human);
  petAgeHumanDetailEl.textContent = res.detail;
}

function clearPet() {
  if (!petTypeEl || !petAgeYearsEl) return;
  petAgeYearsEl.value = '';
  petAgeHumanEl.textContent = '-';
  petAgeHumanDetailEl.textContent = '-';
}

if (calcPetAgeBtn) calcPetAgeBtn.addEventListener('click', calcPetAge);
if (clearPetBtn) clearPetBtn.addEventListener('click', clearPet);

// ---------- Anniversary / Time Diff ----------
const annDayEl = $("annDay");
const annMonthEl = $("annMonth");
const annYearEl = $("annYear");
const calcAnnDiffBtn = $("calcAnnDiff");
const clearAnnBtn = $("clearAnnBtn");

const annYearsEl = $("annYears");
const annMonthsEl = $("annMonths");
const annDaysEl = $("annDays");
const annSecondsEl = $("annSeconds");

function parseAnnInputs() {
  const day = Number(annDayEl.value);
  const month = Number(annMonthEl.value);
  const year = Number(annYearEl.value);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (day < 1 || month < 1 || month > 12 || year < 1300) return null;
  const dt = new Date(year, month - 1, day);
  // ensure valid
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return dt;
}

function calcAnnDiff() {
  if (!annDayEl || !annMonthEl || !annYearEl) return;
  const target = parseAnnInputs();
  if (!target) {
    alert('ادخل تاريخ صحيح (يوم/شهر/سنة).');
    return;
  }

  const fromDate = startOfDay(target);
  const toDate = startOfDay(new Date());

  // If in the future, allow negative? We'll just swap to keep positive diff.
  const isFuture = fromDate > toDate;
  const a = isFuture ? toDate : fromDate;
  const b = isFuture ? fromDate : toDate;

  const { years, months, days } = diffYMD(a, b);
  const seconds = Math.floor((b - a) / 1000);

  annYearsEl.textContent = new Intl.NumberFormat('ar-EG').format(years);
  annMonthsEl.textContent = new Intl.NumberFormat('ar-EG').format(months);
  annDaysEl.textContent = new Intl.NumberFormat('ar-EG').format(days);
  annSecondsEl.textContent = new Intl.NumberFormat('ar-EG').format(seconds);
}

function clearAnn() {
  if (!annDayEl || !annMonthEl || !annYearEl) return;
  annDayEl.value = '';
  annYearEl.value = '';
  annMonthEl.value = '1';
  annYearsEl.textContent = '-';
  annMonthsEl.textContent = '-';
  annDaysEl.textContent = '-';
  annSecondsEl.textContent = '-';
}

if (calcAnnDiffBtn) calcAnnDiffBtn.addEventListener('click', calcAnnDiff);
if (clearAnnBtn) clearAnnBtn.addEventListener('click', clearAnn);

// ---------- Wire existing Personal Calculator ----------
calcBtn.addEventListener('click', calc);
clearBtn.addEventListener('click', clearAll);
setTodayBtn.addEventListener('click', setInputsToToday);

// init
showToday();
renderBirthMonthOptions();

// Load persisted birth date (if any). If none, default to today.
if (!loadPersistedBirthInputs()) {
  setInputsToToday();
}

calc();

// Ensure initial tab state matches UI markup
setActiveTab('personal');






