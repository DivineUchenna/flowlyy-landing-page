import { answersUpTo, buildBookingUrl, calLinkFromUrl, calPrefill, captureTracking, cleanDraft, qualificationReason, validEmail, validPhone } from "./logic.js";

// Divine's Cal.com discovery-call event. Change this one line to point the funnel at a different event.
const BOOKING_URL = "https://cal.com/divine-uchenna-amakiri/discovery-call";
const CAL_NAMESPACE = "discovery-call";
const CAL_EMBED_SCRIPT = "https://app.cal.com/embed/embed.js";
const DRAFT_KEY = "flowlyy-consultation-funnel-draft";
const LEAD_KEY = "flowlyy-consultation-funnel-lead";

// Ask the hard qualifiers first, then gather enough context to make the discovery call useful.
const questions = [
  {
    id: "companyType", title: "Which best describes your business?", type: "single",
    options: [["self_performing", "A roofing company with our own roofers"], ["mixed_delivery", "A roofing company using our team and subcontractors"], ["subcontracted", "We subcontract all roofing work"], ["general_builder", "A general building company that also does roofing"], ["supplier", "A roofing supplier, manufacturer or consultant"]]
  },
  {
    id: "turnover", title: "What’s your approximate annual turnover?", copy: "A rough range is fine. It helps us recommend something that fits the size of your firm.", type: "single",
    options: [["under_100k", "Under £100,000 per year"], ["100k_250k", "£100,000 to £250,000 per year"], ["250k_500k", "£250,000 to £500,000 per year"], ["500k_1m", "£500,000 to £1 million per year"], ["over_1m", "Over £1 million per year"]]
  },
  {
    id: "teamSize", title: "How many people work in the business?", copy: "Include yourself, office staff and roofers on the tools.", type: "single",
    options: [["1_4", "1 to 4 people"], ["5_10", "5 to 10 people"], ["11_20", "11 to 20 people"], ["over_20", "More than 20 people"]]
  },
  {
    id: "workType", title: "What kind of work do you mainly do?", copy: "Choose all that apply.", type: "multi",
    options: [["roof_repairs", "Roof repairs"], ["roof_replacement", "Roof replacement"], ["flat_roofing", "Flat roofing"], ["gutters", "Gutter repairs and installation"], ["leadwork", "Leadwork"], ["chimney_repairs", "Chimney repairs"]]
  },
  {
    id: "pains", title: "What do you want off your plate?", copy: "Choose all that apply.", type: "multi",
    options: [["quote_delays", "Getting quotes out on time"], ["quote_follow_up", "Chasing quotes until customers answer"], ["missed_calls", "Answering calls while the team is on a roof"], ["invoice_chasing", "Chasing invoices and late payments"], ["cert_admin", "Certificates, insurance and scheme paperwork"], ["team_admin", "Subcontractor, timesheet and payroll admin"]]
  },
  {
    id: "contact", title: "Where do we send your plan, and how do we call you?", type: "contact",
    fields: [
      { id: "firstName", label: "First name", type: "text", autocomplete: "given-name", placeholder: "First name" },
      { id: "lastName", label: "Last name", type: "text", autocomplete: "family-name", placeholder: "Last name" },
      { id: "phone", label: "Phone", type: "tel", autocomplete: "tel", placeholder: "+44 7700 900000" },
      { id: "email", label: "Email", type: "email", autocomplete: "email", placeholder: "you@company.co.uk" }
    ]
  }
];

const root = document.querySelector("#step-root");
const actions = document.querySelector("#form-actions");
const nextButton = document.querySelector("#continue-button");
const backButton = document.querySelector("#back-button");
const progressTrack = document.querySelector("#progress-track");
const progressFill = document.querySelector("#progress-fill");
const hero = document.querySelector("#card-hero");
const areaNote = document.querySelector("#area-note");
const card = document.querySelector("#funnel-card");

const saved = safeRead(DRAFT_KEY);
let answers = cleanDraft(saved?.answers, questions);
let tracking = saved?.tracking ?? captureTracking(window.location.search);
let stepIndex = 0;
let calListenerBound = false;
let transitioning = false;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// How long a tapped answer stays visibly selected before the next question slides in.
const SELECT_PAUSE_MS = 260;

function safeRead(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

function safeWrite(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: the funnel still works */ }
}

function saveDraft() {
  safeWrite(DRAFT_KEY, { answers, tracking, updatedAt: new Date().toISOString() });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function setProgress(percent) {
  progressFill.style.width = `${percent}%`;
  progressTrack.setAttribute("aria-valuenow", String(percent));
}

function updateProgress() {
  setProgress(Math.round(((stepIndex + 1) / questions.length) * 100));
}

// Questions show the headline, area note and back link; result screens (not a fit, calendar, booked) hide them.
function setMode(mode) {
  const onQuestion = mode === "question";
  hero.hidden = !onQuestion;
  areaNote.hidden = !onQuestion;
  backButton.hidden = !onQuestion || stepIndex === 0;
  if (!onQuestion) actions.hidden = true;
}

function optionsMarkup(question) {
  const current = answers[question.id];
  return `<div class="options" role="${question.type === "multi" ? "group" : "radiogroup"}" aria-label="${escapeHtml(question.title)}">
    ${question.options.map(([value, label], index) => {
      const selected = question.type === "multi" ? (current ?? []).includes(value) : current === value;
      return `<button class="option ${question.type === "multi" ? "checkbox" : ""} ${selected ? "selected" : ""}" type="button" data-value="${value}" role="${question.type === "multi" ? "checkbox" : "radio"}" aria-checked="${selected}">
        <span class="key" aria-hidden="true">${index + 1}</span><span class="option-text">${label}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function contactMarkup(question) {
  return `<div class="contact-grid">
    ${question.fields.map((field) => `<div class="field-wrap field-${field.id}">
      <label for="field-${field.id}">${field.label}</label>
      <input id="field-${field.id}" name="${field.id}" type="${field.type}" value="${escapeHtml(answers[field.id] ?? "")}" placeholder="${field.placeholder}" autocomplete="${field.autocomplete}" required aria-describedby="error-${field.id}">
      <p class="error" id="error-${field.id}" role="alert"></p>
    </div>`).join("")}
  </div>`;
}

function renderQuestion({ focus = true } = {}) {
  const question = questions[stepIndex];
  const isLast = stepIndex === questions.length - 1;
  setMode("question");
  // Single-choice questions move on as soon as an answer is tapped, so they don't need a Continue button.
  actions.hidden = question.type === "single";
  nextButton.innerHTML = isLast ? 'Book my call <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
  root.innerHTML = `<section class="step" aria-labelledby="question-title">
    <div class="question-panel">
      <p class="answer-label"><span aria-hidden="true">👇</span> Answer below to continue</p>
      ${question.promise ? `<p class="question-promise">${question.promise}</p>` : ""}
      <h2 id="question-title">${question.title}</h2>
      ${question.copy ? `<p class="step-copy">${question.copy}</p>` : ""}
    </div>
    ${question.type === "contact" ? contactMarkup(question) : optionsMarkup(question)}
    ${question.type === "contact" ? '<p class="secure-note">Secure and never shared</p>' : ""}
    <p class="error" id="step-error" role="alert"></p>
  </section>`;

  if (question.options) return bindOptions(question);
  question.fields.forEach((field) => {
    const input = document.querySelector(`#field-${field.id}`);
    input.addEventListener("input", () => {
      answers[field.id] = input.value.trim();
      saveDraft();
      document.querySelector(`#error-${field.id}`).textContent = "";
    });
  });
  if (focus) requestAnimationFrame(() => document.querySelector(`#field-${question.fields[0].id}`)?.focus({ preventScroll: true }));
}

function reasonSoFar() {
  return qualificationReason(answersUpTo(answers, questions, stepIndex));
}

function markSelected(button, selected) {
  button.classList.toggle("selected", selected);
  button.setAttribute("aria-checked", String(selected));
}

// Taps update the buttons in place (no redraw), so the colour change can ease in instead of the whole step flickering.
function bindOptions(question) {
  const buttons = [...root.querySelectorAll(".option")];
  buttons.forEach((button) => button.addEventListener("click", () => {
    if (transitioning) return;
    const value = button.dataset.value;
    document.querySelector("#step-error").textContent = "";
    if (question.type === "multi") {

      const selected = new Set(answers[question.id] ?? []);
      selected.has(value) ? selected.delete(value) : selected.add(value);
      answers[question.id] = [...selected];
      markSelected(button, selected.has(value));
      return saveDraft();
    }
    answers[question.id] = value;
    saveDraft();
    buttons.forEach((other) => markSelected(other, other === button));
    transitioning = true;
    window.setTimeout(() => { transitioning = false; next(); }, reducedMotion ? 0 : SELECT_PAUSE_MS);
  }));
}

// Fades the current step out, then swaps in the next screen (which fades in via CSS).
function leaveStep(then) {
  const step = root.querySelector(".step");
  if (!step || reducedMotion) return then();
  transitioning = true;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    transitioning = false;
    then();
  };
  step.classList.add("is-leaving");
  step.addEventListener("animationend", finish, { once: true });
  window.setTimeout(finish, 260);
}

// Only scroll when the top of the card is off-screen (e.g. on a phone); otherwise leave the page still.
function keepCardInView() {
  const top = card.getBoundingClientRect().top;
  if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: reducedMotion ? "auto" : "smooth" });
}

function contactError(fieldId, value) {
  if (!value) return "Please fill this in.";
  if (fieldId === "email" && !validEmail(value)) return "Enter a valid email address.";
  if (fieldId === "phone" && !validPhone(value)) return "Enter a valid phone number.";
  return "";
}

function validateCurrent() {
  const question = questions[stepIndex];
  if (question.type === "contact") {
    let firstInvalid = null;
    question.fields.forEach((field) => {
      const message = contactError(field.id, answers[field.id]);
      document.querySelector(`#error-${field.id}`).textContent = message;
      if (message && !firstInvalid) firstInvalid = field.id;
    });
    if (firstInvalid) document.querySelector(`#field-${firstInvalid}`).focus();
    return !firstInvalid;
  }
  const value = answers[question.id];
  const message = (Array.isArray(value) ? value.length : value) ? "" : "Please answer this before continuing.";
  document.querySelector("#step-error").textContent = message;
  return !message;
}

function next() {
  if (transitioning || !validateCurrent()) return;
  const reason = reasonSoFar();
  if (reason) return leaveStep(() => { renderDisqualified(reason); keepCardInView(); });
  if (stepIndex === questions.length - 1) return leaveStep(() => { renderBooking(); keepCardInView(); });
  goTo(stepIndex + 1);
}

function goTo(index, { scroll = true } = {}) {
  const show = () => {
    stepIndex = index;
    updateProgress();
    renderQuestion({ focus: scroll });
    if (scroll) keepCardInView();
  };
  scroll ? leaveStep(show) : show();
}

function renderDisqualified(reason) {
  setMode("result");
  setProgress(100);
  const messages = {
    companyType: "Right now Flowlyy is built for roofing companies that carry out jobs with their own team.",
    turnover: "Right now we only work with roofing companies turning over £100,000 or more a year."
  };
  root.innerHTML = `<section class="step" aria-labelledby="outcome-title">
    <div class="outcome-icon" aria-hidden="true">👋</div>
    <p class="eyebrow">Thanks for your time</p>
    <h2 id="outcome-title">We may not be the right fit just yet.</h2>
    <p class="lede">${messages[reason]}</p>
    <p class="step-copy">Thanks for being straight with us. We’d rather keep it honest than push you into something that doesn’t fit yet.</p>
    <div class="outcome-actions"><button class="back-button" id="restart-button" type="button">← Review my answers</button></div>
  </section>`;
  document.querySelector("#restart-button").addEventListener("click", () => goTo(Math.max(0, stepIndex)));
}

// Official Cal.com embed loader: queues calls until embed.js has loaded.
function loadCal() {
  (function (C, A, L) { const p = function (a, ar) { a.q.push(ar); }; const d = C.document; C.Cal = C.Cal || function () { const cal = C.Cal; const ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, CAL_EMBED_SCRIPT, "init");
  if (!window.Cal.ns?.[CAL_NAMESPACE]) window.Cal("init", CAL_NAMESPACE, { origin: "https://app.cal.com" });
  return window.Cal.ns[CAL_NAMESPACE];
}

function renderBooking() {
  saveDraft();
  safeWrite(LEAD_KEY, { answers, tracking, qualification: "qualified", preparedAt: new Date().toISOString() });
  setMode("result");
  setProgress(100);
  const bookingUrl = buildBookingUrl(BOOKING_URL, answers, tracking);
  root.innerHTML = `<section class="step" aria-labelledby="outcome-title">
    <p class="eyebrow">You look like a strong fit</p>
    <h2 id="outcome-title">Thanks, ${escapeHtml(answers.firstName)}. Pick a time for your call.</h2>
    <p class="step-copy">Your details are already filled in. Choose a slot and we’ll send your plan to ${escapeHtml(answers.email)}.</p>
    <div class="cal-embed" id="cal-embed" aria-label="Book your discovery call"></div>
    <p class="integration-note">Calendar not loading? <a href="${escapeHtml(bookingUrl)}" target="_blank" rel="noopener">Open it in a new tab</a>.</p>
    <div class="outcome-actions"><button class="back-button" id="edit-details" type="button">← Edit my details</button></div>
  </section>`;
  document.querySelector("#edit-details").addEventListener("click", () => goTo(questions.length - 1));

  const cal = loadCal();
  cal("inline", {
    elementOrSelector: "#cal-embed",
    calLink: calLinkFromUrl(BOOKING_URL),
    config: { ...calPrefill(answers), ...tracking, layout: "column_view", theme: "light" }
  });
  cal("ui", { theme: "light", hideEventTypeDetails: true, layout: "column_view" });
  if (!calListenerBound) {
    cal("on", { action: "bookingSuccessful", callback: renderBooked });
    calListenerBound = true;
  }
}

function renderBooked() {
    if (typeof window.fbq === "function") window.fbq("track", "Lead");
  setMode("result");
  setProgress(100);
  
    
safeWrite(LEAD_KEY, { answers, tracking, qualification: "booked", bookedAt: new Date().toISOString() });
  root.innerHTML = `<section class="step" aria-labelledby="outcome-title">
    <div class="outcome-icon" aria-hidden="true">⚡</div>
    <p class="eyebrow">You’re booked in</p>
    <h2 id="outcome-title">See you on the call, ${escapeHtml(answers.firstName)}.</h2>
    <p class="lede">A calendar invite is on its way to ${escapeHtml(answers.email)}. We’ll map where quotes and admin are slowing the business down, then send your plan after the call.</p>
  </section>`;
}

backButton.addEventListener("click", () => { if (stepIndex > 0 && !transitioning) goTo(stepIndex - 1); });
nextButton.addEventListener("click", next);

document.addEventListener("keydown", (event) => {
  const typing = event.target.tagName === "INPUT";
  if (event.key === "Enter" && event.target.tagName !== "BUTTON" && event.target.tagName !== "A") {
    event.preventDefault();
    if (!actions.hidden) next();
  }
  if (!typing && /^[0-9]$/.test(event.key)) {
    const shortcutIndex = event.key === "0" ? 9 : Number(event.key) - 1;
    const option = root.querySelectorAll(".option")[shortcutIndex];
    if (option) option.click();
  }
});

goTo(0, { scroll: false });

