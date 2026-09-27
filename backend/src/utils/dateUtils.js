/**
 * Formats a Date instance into a local YYYY-MM-DD calendar date string.
 * @param {Date} [date=new Date()]
 * @returns {string} YYYY-MM-DD
 */
export function getDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's local calendar date string in YYYY-MM-DD format.
 * @returns {string} YYYY-MM-DD
 */
export function getTodayDateString() {
  return getDateString(new Date());
}

/**
 * Returns yesterday's local calendar date string in YYYY-MM-DD format.
 * @returns {string} YYYY-MM-DD
 */
export function getYesterdayDateString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateString(yesterday);
}

/**
 * Calculates the calendar day difference between dateStrA and dateStrB (dateStrA - dateStrB).
 * Uses UTC midnight normalization of local calendar components to avoid DST anomalies.
 * @param {string} dateStrA YYYY-MM-DD
 * @param {string} dateStrB YYYY-MM-DD
 * @returns {number} positive if dateStrA is after dateStrB, 0 if same day, negative if before
 */
export function getDaysDifference(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) {
    return 0;
  }

  const [yA, mA, dA] = dateStrA.split("-").map(Number);
  const [yB, mB, dB] = dateStrB.split("-").map(Number);

  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utcA - utcB) / MS_PER_DAY);
}

/**
 * Checks if a given date string represents today in local time.
 * @param {string} dateStr YYYY-MM-DD
 * @returns {boolean}
 */
export function isToday(dateStr) {
  return Boolean(dateStr) && dateStr === getTodayDateString();
}

/**
 * Checks if a given date string represents yesterday in local time.
 * @param {string} dateStr YYYY-MM-DD
 * @returns {boolean}
 */
export function isYesterday(dateStr) {
  return Boolean(dateStr) && dateStr === getYesterdayDateString();
}

/**
 * Returns an array of the last 7 local calendar dates in YYYY-MM-DD format,
 * ordered from 6 days ago up to today (or reference date).
 * @param {string} [baseDateStr]
 * @returns {string[]}
 */
export function getLast7Days(baseDateStr) {
  let baseDate = new Date();
  if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    const [y, m, d] = baseDateStr.split("-").map(Number);
    baseDate = new Date(y, m - 1, d);
  }

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);
    last7Days.push(getDateString(date));
  }

  return last7Days;
}
