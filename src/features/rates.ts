import store from "../store/store.ts";
import {
    CONVERSION_RATES_FETCH_INTERVAL_MS,
    MIN_AMOUNT_PER_HOUR,
    MAX_AMOUNT_PER_HOUR,
} from "../constants.ts";
import type { Enhancement } from "../types.ts";
import { defaultVMSettings } from "../store/defaults.ts";
import type { VMSettings } from "../types.ts";

type ConversionRates = VMSettings["conversionRates"];

async function fetchRates() {
    const { timestamp, ...conversionRates } = structuredClone(
        defaultVMSettings.conversionRates,
    );
    const currencies = Object.keys(
        conversionRates,
    ) as (keyof typeof conversionRates)[];
    const responses = await Promise.all(
        currencies.map(async (currency) => {
            try {
                const res = await fetch(
                    `https://open.er-api.com/v6/latest/${currency}`,
                );
                const data = await res.json();
                return { currency, data };
            } catch {
                return null;
            }
        }),
    );
    for (const resp of responses) {
        if (!resp) continue;
        const { currency, data } = resp;
        console.log("Fetched rates for: ", currency, data);
        for (const c of currencies) {
            if (c === currency) continue;
            conversionRates[currency].rates[c] = data.rates[c];
        }
    }

    return conversionRates as ConversionRates;
}

async function updateRates() {
    const { conversionRates } = await store.get(["conversionRates"]);

    const now = Date.now();
    if (now - conversionRates.timestamp < CONVERSION_RATES_FETCH_INTERVAL_MS)
        return;

    const newConversionRates = await fetchRates();
    newConversionRates.timestamp = now;

    await store.set({
        conversionRates: newConversionRates,
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

function getSymbol(currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
    })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value;
}

class ConvertCurrencyEnhancement implements Enhancement {
    async apply() {
        const elements = document.querySelectorAll("span.reward span");
        const { selectedCurrency, conversionRates } = await store.get([
            "selectedCurrency",
            "conversionRates",
        ]);

        const selectedSymbol = getSymbol(selectedCurrency);
        const rate =
            selectedCurrency === "USD"
                ? conversionRates.GBP.rates.USD
                : conversionRates.USD.rates.GBP;

        for (const element of elements) {
            let sourceText = element.getAttribute("data-original-text");
            if (!sourceText) {
                element.setAttribute(
                    "data-original-text",
                    element.textContent || "",
                );
                sourceText = element.textContent || "";
            }
            const currentSymbol = extractSymbol(element.textContent);
            const sourceSymbol = extractSymbol(sourceText);
            if (
                sourceSymbol === selectedCurrency &&
                element.textContent !== sourceText
            ) {
                // Revert to original text
                element.textContent = sourceText;
                continue;
            }
            // Skip if already in the desired currency
            if (currentSymbol === selectedSymbol) continue;

            const elementRate = extractHourlyRate(element.textContent);
            let modified = `${selectedSymbol}${(elementRate * rate).toFixed(2)}`;
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

            const { conversionRates } = await store.get(["conversionRates"]);

            const min =
                symbol === "$"
                    ? MIN_AMOUNT_PER_HOUR
                    : MIN_AMOUNT_PER_HOUR * conversionRates.USD.rates.GBP;
            const max =
                symbol === "$"
                    ? MAX_AMOUNT_PER_HOUR
                    : MAX_AMOUNT_PER_HOUR * conversionRates.USD.rates.GBP;

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
