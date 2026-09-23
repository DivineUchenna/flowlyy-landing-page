export const QUALIFYING_COMPANY_TYPES = new Set(["self_performing", "mixed_delivery"]);
export const QUALIFYING_TURNOVER = new Set(["100k_250k", "250k_500k", "500k_1m", "over_1m"]);
export const CONTACT_FIELDS = ["firstName", "lastName", "phone", "email"];

const TURNOVER_LABELS = { under_100k: "Under £100,000", "100k_250k": "£100,000 to £250,000", "250k_500k": "£250,000 to £500,000", "500k_1m": "£500,000 to £1 million", over_1m: "Over £1 million" };
const COMPANY_TYPE_LABELS = { self_performing: "Roofing company with its own roofers", mixed_delivery: "Roofing company using its own team and subcontractors", subcontracted: "All roofing work subcontracted", general_builder: "General building company that also does roofing", supplier: "Roofing supplier, manufacturer or consultant" };
const TEAM_SIZE_LABELS = { "1_4": "1 to 4 people", "5_10": "5 to 10 people", "11_20": "11 to 20 people", over_20: "More than 20 people" };
const WORK_LABELS = { roof_repairs: "Roof repairs", roof_replacement: "Roof replacement", flat_roofing: "Flat roofing", gutters: "Gutter repairs and installation", leadwork: "Leadwork", chimney_repairs: "Chimney repairs" };
const PAIN_LABELS = { quote_delays: "Getting quotes out on time", quote_follow_up: "Chasing quotes until customers answer", missed_calls: "Answering calls while the team is on a roof", invoice_chasing: "Chasing invoices and late payments", cert_admin: "Certificates, insurance and scheme paperwork", team_admin: "Subcontractor, timesheet and payroll admin" };

export function qualificationReason(answers) {
  if (answers.companyType && !QUALIFYING_COMPANY_TYPES.has(answers.companyType)) return "companyType";
  if (answers.turnover && !QUALIFYING_TURNOVER.has(answers.turnover)) return "turnover";
  return null;
}

// Keeps only saved answers that still exist in the current question set, so a draft
// saved by an older version of the funnel can't carry dead values into this one.
export function cleanDraft(saved, questions) {
  const clean = {};
  for (const question of questions) {
    if (question.fields) {
      question.fields.forEach(({ id }) => { if (typeof saved?.[id] === "string") clean[id] = saved[id]; });
      continue;
    }
    const valid = new Set(question.options.map(([value]) => value));
    const value = saved?.[question.id];
    if (question.type === "multi" && Array.isArray(value)) {
      const kept = value.filter((item) => valid.has(item));
      if (kept.length) clean[question.id] = kept;
    } else if (valid.has(value)) {
      clean[question.id] = value;
    }
  }
  return clean;
}

// The answers for the questions up to and including `index`. Qualification is judged on these only,
// so an answer to a later question can never block someone on an earlier one.
export function answersUpTo(answers, questions, index) {
  const ids = questions.slice(0, index + 1).flatMap((question) => question.fields ? question.fields.map(({ id }) => id) : [question.id]);
  return Object.fromEntries(ids.filter((id) => id in answers).map((id) => [id, answers[id]]));
}

export function isQualified(answers) {
  const required = ["companyType", "turnover", "teamSize", "workType", "pains", ...CONTACT_FIELDS];
  const complete = required.every((key) => Array.isArray(answers[key]) ? answers[key].length > 0 : Boolean(answers[key]));
  return complete && qualificationReason(answers) === null;
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function validPhone(value) {
  return /^[+()\d][+()\d\s.-]{7,}$/.test(String(value).trim());
}

// Cal.com expects phone numbers in international format (+447700900000).
// UK numbers typed as 07700 900000 are converted; anything else keeps its digits.
export function normalisePhone(value) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  let international;
  if (raw.startsWith("+")) international = `+${digits}`;
  else if (digits.startsWith("00")) international = `+${digits.slice(2)}`;
  else if (digits.startsWith("44")) international = `+${digits}`;
  else if (digits.startsWith("0")) international = `+44${digits.slice(1)}`;
  else international = `+${digits}`;
  // "+44 (0)7700..." is a common UK habit; the bracketed 0 must be dropped.
  return international.replace(/^\+440/, "+44");
}

export function fullName(answers) {
  return [answers.firstName, answers.lastName].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ");
}

// Plain-English summary of the fit-check answers, shown to Divine in the Cal.com booking.
export function leadSummary(answers) {
  const list = (values, labels) => (values ?? []).map((value) => labels[value] ?? value).join(", ") || "-";
  return [
    "Flowlyy fit check",
    `Company type: ${COMPANY_TYPE_LABELS[answers.companyType] ?? answers.companyType ?? "-"}`,
    `Turnover: ${TURNOVER_LABELS[answers.turnover] ?? answers.turnover ?? "-"}`,
    `Team size: ${TEAM_SIZE_LABELS[answers.teamSize] ?? answers.teamSize ?? "-"}`,
    `Type of work: ${list(answers.workType, WORK_LABELS)}`,
    `What they want off their plate: ${list(answers.pains, PAIN_LABELS)}`,
    `Phone: ${answers.phone ?? "-"}`
  ].join("\n");
}

// Prefill values for the Cal.com booker, so the lead only has to pick a time.
export function calPrefill(answers) {
  return {
    name: fullName(answers),
    email: String(answers.email ?? "").trim(),
    attendeePhoneNumber: normalisePhone(answers.phone),
    notes: leadSummary(answers)
  };
}

export function buildBookingUrl(baseUrl, answers, tracking = {}) {
  if (!baseUrl) return "";
  const url = new URL(baseUrl);
  const params = { ...tracking, ...calPrefill(answers) };
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
}

// "https://cal.com/name/event" -> "name/event", the format the Cal.com embed expects.
export function calLinkFromUrl(bookingUrl) {
  if (!bookingUrl) return "";
  return new URL(bookingUrl).pathname.replace(/^\/+|\/+$/g, "");
}

export function captureTracking(search) {
  const params = new URLSearchParams(search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  return Object.fromEntries(keys.flatMap((key) => params.get(key) ? [[key, params.get(key)]] : []));
}
