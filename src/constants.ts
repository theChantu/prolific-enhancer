const NOTIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GBP_TO_USD_FETCH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_AMOUNT_PER_HOUR = 7; // Minimum amount before red highlight
const MAX_AMOUNT_PER_HOUR = 15; // Maximum amount before green highlight
const FALLBACK_GBP_TO_USD_RATE = 1.35;
const FALLBACK_USD_TO_GBP_RATE = 0.74;

export {
    NOTIFY_TTL_MS,
    GBP_TO_USD_FETCH_INTERVAL_MS,
    MIN_AMOUNT_PER_HOUR,
    MAX_AMOUNT_PER_HOUR,
    FALLBACK_GBP_TO_USD_RATE,
    FALLBACK_USD_TO_GBP_RATE,
};
