import store from "../store";
import {
    GBP_TO_USD_FETCH_INTERVAL_MS,
    MIN_AMOUNT_PER_HOUR,
    MAX_AMOUNT_PER_HOUR,
} from "../constants.ts";
import type { Enhancement } from "../types.ts";

async function fetchGbpRate() {
    const response = await fetch("https://open.er-api.com/v6/latest/GBP");
    const data = await response.json();
    return data.rates.USD;
}

async function fetchUsdRate() {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await response.json();
    return data.rates.GBP;
}

async function updateRates() {
    const { rates } = await store.get({
        rates: {
            timestamp: 0,
            gbpToUsd: { rate: 1.35 },
            usdToGbp: { rate: 0.74 },
        },
    });

    const now = Date.now();
    if (now - rates.timestamp < GBP_TO_USD_FETCH_INTERVAL_MS) return;

    const gbpToUsdRate = (await fetchGbpRate().catch(console.error)) || 1.35; // fallback rate
    const usdToGbpRate = (await fetchUsdRate().catch(console.error)) || 0.74; // fallback rate

    await store.set({
        rates: {
            timestamp: now,
            gbpToUsd: { rate: gbpToUsdRate },
            usdToGbp: { rate: usdToGbpRate },
        },
    });
}

function extractHourlyRate(text: string) {
    const m = text.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
}

function rateToColor(rate: number, min = 7, max = 15) {
    const clamped = Math.min(Math.max(rate, min), max);

    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logRate = Math.log(clamped);

    const ratio = (logRate - logMin) / (logMax - logMin);
    const bias = Math.pow(ratio, 0.6); // Adjust bias for better color distribution

    const r = Math.round(255 * (1 - bias));
    const g = Math.round(255 * bias);

    return `rgba(${r}, ${g}, 0, 0.63)`;
}

function extractSymbol(text: string) {
    const m = text.match(/[£$€]/);
    return m ? m[0] : null;
}

class ConvertCurrencyEnhancement implements Enhancement {
    async apply() {
        const elements = document.querySelectorAll("span.reward span");
        const {
            currency = "$",
            gbpToUsd = { rate: 1.35, timestamp: 0 },
            usdToGbp = { rate: 0.74, timestamp: 0 },
        } = await store.get(["currency", "gbpToUsd", "usdToGbp"]);
        const rate = currency === "$" ? gbpToUsd.rate : usdToGbp.rate;

        for (const element of elements) {
            let originalText = element.getAttribute("data-original-text");
            if (!originalText) {
                element.setAttribute(
                    "data-original-text",
                    element.textContent || "",
                );
                originalText = element.textContent || "";
            }
            const originalSymbol = extractSymbol(originalText);
            const currentSymbol = extractSymbol(element.textContent);
            // Revert if already in original currency
            if (
                originalSymbol === currency &&
                element.textContent !== originalText
            ) {
                element.textContent = originalText;
                continue;
            }
            // Skip if already in the desired currency
            if (currentSymbol === currency) continue;

            const elementRate = extractHourlyRate(element.textContent);
            let modified = `${currency}${(elementRate * rate).toFixed(2)}`;
            if (element.textContent.includes("/hr")) modified += "/hr";
            element.textContent = modified;
        }
    }
    revert() {
        document.querySelectorAll("span[data-original-text]").forEach((el) => {
            el.textContent = el.getAttribute("data-original-text") || "";
            el.removeAttribute("data-original-text");
        });
    }
}

class HighlightRatesEnhancement implements Enhancement {
    async apply() {
        const elements = document.querySelectorAll<HTMLElement>(
            "[data-testid='study-tag-reward-per-hour']",
        );
        for (const element of elements) {
            // Check if the element should be ignored
            if (element.getAttribute("data-testid") === "study-tag-reward") {
                continue;
            }

            const rate = extractHourlyRate(element.textContent);
            const symbol = extractSymbol(element.textContent);
            if (isNaN(rate) || !symbol) return;

            const {
                gbpToUsd = { rate: 1.35, timestamp: 0 },
                usdToGbp = { rate: 0.74, timestamp: 0 },
            } = await store.get(["gbpToUsd", "usdToGbp"]);

            const min =
                symbol === "$"
                    ? MIN_AMOUNT_PER_HOUR
                    : MIN_AMOUNT_PER_HOUR * usdToGbp.rate;
            const max =
                symbol === "$"
                    ? MAX_AMOUNT_PER_HOUR
                    : MAX_AMOUNT_PER_HOUR * usdToGbp.rate;

            element.style.backgroundColor = rateToColor(rate, min, max);

            if (!element.classList.contains("pe-rate-highlight"))
                element.classList.add("pe-rate-highlight");
        }
    }
    revert() {
        document
            .querySelectorAll<HTMLElement>(".pe-rate-highlight")
            .forEach((el) => {
                el.style.backgroundColor = "";
                el.classList.remove("pe-rate-highlight");
            });
    }
}

const highlightRatesEnhancement = new HighlightRatesEnhancement();
const convertCurrencyEnhancement = new ConvertCurrencyEnhancement();

export { updateRates, convertCurrencyEnhancement, highlightRatesEnhancement };
