import store from "../store";
import { GBP_TO_USD_FETCH_INTERVAL_MS } from "../constants.ts";

async function fetchGbpRate() {
    const response = await fetch("https://open.er-api.com/v6/latest/GBP");
    const data = await response.json();
    return data.rates.USD;
}

async function updateGbpRate() {
    const { gbpToUsd } = await store.get({
        gbpToUsd: { rate: 1.35, timestamp: 0 },
    });
    const now = Date.now();
    if (gbpToUsd && now - gbpToUsd.timestamp < GBP_TO_USD_FETCH_INTERVAL_MS)
        return;

    const rate = (await fetchGbpRate().catch(console.error)) || 1.35; // fallback rate
    await store.set({ gbpToUsd: { rate, timestamp: now } });
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

function highlightElement(element: HTMLElement) {
    if (element.classList.contains("pe-rate-highlight")) return;
    const rate = extractHourlyRate(element.textContent);
    if (isNaN(rate)) return;

    element.style.backgroundColor = rateToColor(rate);
    element.classList.add("pe-rate-highlight");
}

function highlightHourlyRates() {
    const elements = document.querySelectorAll<HTMLElement>(
        "[data-testid='study-tag-reward-per-hour']",
    );
    for (const element of elements) {
        // Check if the element should be ignored
        if (element.getAttribute("data-testid") === "study-tag-reward") {
            continue;
        }
        highlightElement(element);
    }
}

function extractSymbol(text: string) {
    const m = text.match(/[£$€]/);
    return m ? m[0] : null;
}

async function convertGbpToUsd() {
    const elements = document.querySelectorAll("span.reward span");
    const { gbpToUsd } = await store.get({
        gbpToUsd: { rate: 1.35, timestamp: 0 },
    });
    const { rate } = gbpToUsd;
    for (const element of elements) {
        const symbol = extractSymbol(element.textContent);
        if (symbol !== "£") continue;

        const elementRate = extractHourlyRate(element.textContent);
        let modified = `$${(elementRate * rate).toFixed(2)}`;
        if (element.textContent.includes("/hr")) modified += "/hr";
        element.textContent = modified;
    }
}

export { updateGbpRate, convertGbpToUsd, highlightHourlyRates };
