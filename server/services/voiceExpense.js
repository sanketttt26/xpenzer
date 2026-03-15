const MONTH_LOOKUP = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const CURRENCY_MAP = [
  { pattern: /\b(?:rupees?|rs\.?|inr)\b/i, code: "INR" },
  { pattern: /\b(?:usd|dollars?)\b/i, code: "USD" },
  { pattern: /\b(?:eur|euros?)\b/i, code: "EUR" },
  { pattern: /\b(?:gbp|pounds?)\b/i, code: "GBP" },
];

const PAYER_BLACKLIST = new Set([
  "rupee",
  "rupees",
  "rs",
  "inr",
  "usd",
  "eur",
  "gbp",
  "dollar",
  "dollars",
  "pound",
  "pounds",
  "paid",
  "spent",
]);

const DATE_CLEANUP_PATTERNS = [
  /\b(?:today|tomorrow|yesterday)\b/gi,
  /\b(?:on\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{2,4})?\b/gi,
  /\b(?:on\s+)?\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s+\d{2,4})?\b/gi,
  /\b(?:on\s+)?\d{4}-\d{2}-\d{2}\b/gi,
];

const DESCRIPTION_PATTERNS = [
  /\bpaid(?:\s+by\s+[a-z][a-z\s'-]*)?\s+for\s+(.+)$/i,
  /\bspent(?:\s+by\s+[a-z][a-z\s'-]*)?\s+on\s+(.+)$/i,
  /\bfor\s+(.+)$/i,
  /\bon\s+(.+)$/i,
];

const normalizeWhitespace = (value = "") =>
  value.replace(/\s+/g, " ").trim();

const normalizeYear = (year) => {
  if (!year) return new Date().getFullYear();

  const numericYear = Number(year);

  if (String(year).length === 2) {
    return numericYear >= 70 ? 1900 + numericYear : 2000 + numericYear;
  }

  return numericYear;
};

const formatDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const buildDate = ({ year, monthIndex, day }) => {
  const candidate = new Date(year, monthIndex, day);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== monthIndex ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return candidate;
};

const parseRelativeDate = (text) => {
  const today = new Date();

  if (/\btoday\b/i.test(text)) return today;
  if (/\byesterday\b/i.test(text)) {
    today.setDate(today.getDate() - 1);
    return today;
  }
  if (/\btomorrow\b/i.test(text)) {
    today.setDate(today.getDate() + 1);
    return today;
  }

  return null;
};

const parseExplicitDate = (text) => {
  const isoDate = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/i);

  if (isoDate) {
    return buildDate({
      year: Number(isoDate[1]),
      monthIndex: Number(isoDate[2]) - 1,
      day: Number(isoDate[3]),
    });
  }

  const monthDayPattern = new RegExp(
    String.raw`\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{2,4}))?\b`,
    "i"
  );

  const dayMonthPattern = new RegExp(
    String.raw`\b(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s+(\d{2,4}))?\b`,
    "i"
  );

  const monthDayMatch = text.match(monthDayPattern);

  if (monthDayMatch) {
    return buildDate({
      year: normalizeYear(monthDayMatch[3]),
      monthIndex: MONTH_LOOKUP[monthDayMatch[1].toLowerCase()],
      day: Number(monthDayMatch[2]),
    });
  }

  const dayMonthMatch = text.match(dayMonthPattern);

  if (dayMonthMatch) {
    return buildDate({
      year: normalizeYear(dayMonthMatch[3]),
      monthIndex: MONTH_LOOKUP[dayMonthMatch[2].toLowerCase()],
      day: Number(dayMonthMatch[1]),
    });
  }

  return null;
};

const scoreAmountCandidate = (text, match) => {
  const value = Number(match[0].replace(/,/g, ""));
  const context = text.slice(
    Math.max(0, match.index - 20),
    match.index + match[0].length + 20
  );

  let score = 1;

  if (/\b(?:rupees?|rs\.?|inr|usd|dollars?|eur|euros?|gbp|pounds?)\b/i.test(context)) {
    score += 3;
  }

  if (/\b(?:paid|spent|cost|expense|for)\b/i.test(context)) {
    score += 2;
  }

  if (
    value >= 1900 &&
    value <= 2100 &&
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(
      context
    )
  ) {
    score -= 4;
  }

  return score;
};

const parseAmount = (text) => {
  const matches = [...text.matchAll(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g)];

  if (matches.length === 0) return null;

  const bestMatch = matches
    .map((match) => ({
      value: Number(match[0].replace(/,/g, "")),
      score: scoreAmountCandidate(text, match),
    }))
    .sort((first, second) => second.score - first.score)[0];

  return Number.isFinite(bestMatch?.value) ? bestMatch.value : null;
};

const parseCurrency = (text) => {
  const currency = CURRENCY_MAP.find(({ pattern }) => pattern.test(text));
  return currency?.code || "INR";
};

const cleanupPhrase = (value = "") =>
  normalizeWhitespace(
    value
      .replace(/[.,!?]+$/g, "")
      .replace(/\b(?:paid|spent|for|on|by)\b$/gi, "")
  );

const parsePayer = (text) => {
  if (
    /\b(?:i\s+paid|i\s+spent|paid\s+by\s+me|spent\s+by\s+me|me\s+paid|me\s+spent)\b/i.test(
      text
    )
  ) {
    return "me";
  }

  const patterns = [
    /\b(?:paid|spent)\s+by\s+([a-z][a-z\s'-]*?)(?=\s+(?:for|on)\b|$)/i,
    /\b([a-z][a-z\s'-]*?)\s+(?:paid|spent)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match?.[1]) continue;

    const payer = cleanupPhrase(match[1]).toLowerCase();

    if (!payer) continue;

    const words = payer.split(" ");

    if (words.some((word) => PAYER_BLACKLIST.has(word))) {
      continue;
    }

    return payer;
  }

  return null;
};

const stripDatePhrases = (value) =>
  DATE_CLEANUP_PATTERNS.reduce(
    (accumulator, pattern) => accumulator.replace(pattern, ""),
    value
  );

const parseDescription = (text) => {
  for (const pattern of DESCRIPTION_PATTERNS) {
    const match = text.match(pattern);

    if (!match?.[1]) continue;

    const cleaned = cleanupPhrase(stripDatePhrases(match[1]).toLowerCase());

    if (cleaned) return cleaned;
  }

  const stripped = cleanupPhrase(
    stripDatePhrases(
      text
        .toLowerCase()
        .replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g, "")
        .replace(/\b(?:rupees?|rs\.?|inr|usd|dollars?|eur|euros?|gbp|pounds?)\b/g, "")
        .replace(/\b(?:i|me|myself|paid|spent|pay|expense|expenses|by)\b/g, "")
    )
  );

  return stripped || null;
};

const parseEnglishVoiceExpense = (text, language) => {
  const amount = parseAmount(text);
  const currency = parseCurrency(text);
  const payer = parsePayer(text);
  const date = formatDate(parseRelativeDate(text) || parseExplicitDate(text));
  const description = parseDescription(text);
  const missingFields = [];
  const notes = [];

  if (!Number.isFinite(amount)) {
    missingFields.push("amount");
  }

  if (!description) {
    missingFields.push("description");
  }

  if (!payer) {
    missingFields.push("payer");
  } else if (payer !== "me") {
    notes.push(
      "The current add expense flow records the logged-in user as the payer, so please review this voice draft before submitting."
    );
  }

  if (currency !== "INR") {
    notes.push(
      "This app currently stores numeric amounts without a separate currency field, so please verify the currency before saving."
    );
  }

  return {
    transcript: normalizeWhitespace(text),
    language,
    amount: Number.isFinite(amount) ? amount : null,
    currency,
    description,
    payer,
    date,
    missingFields,
    notes,
  };
};

const PARSERS = {
  en: parseEnglishVoiceExpense,
  "en-in": parseEnglishVoiceExpense,
};

class VoiceExpenseService {
  parse(text, language = "en-IN") {
    const normalizedText = normalizeWhitespace(text);
    const parserKey = language.toLowerCase();
    const parser = PARSERS[parserKey] || PARSERS.en;

    return parser(normalizedText, language);
  }
}

export default new VoiceExpenseService();
