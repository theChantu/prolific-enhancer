import BaseEnhancement from "./BaseEnhancement";
import store from "@/store/store";
import { MIN_AMOUNT_PER_HOUR, MAX_AMOUNT_PER_HOUR } from "@/constants";
import extractHourlyRate from "@/lib/extractHourlyRate";

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

class HighlightRatesEnhancement extends BaseEnhancement {
    async apply() {
        const elements = this.adapter.getHourlyRateElements();
        for (const element of elements) {
            // Check if the element should be ignored
            if (element.classList.contains("pe-rate-highlight")) {
                continue;
            }

            const rate = extractHourlyRate(element.textContent);
            const { displaySymbol, sourceSymbol } =
                this.adapter.getCurrencyInfo(element);
            if (isNaN(rate)) return;

            const { conversionRates } = await store.get(this.adapter.siteName, [
                "conversionRates",
            ]);

            // TODO: Always convert to USD before highlighting to get proper color coding
            // This will help when multiple currencies are supported
            // Can fetch conversion rate if needed

            const min =
                displaySymbol === "$"
                    ? MIN_AMOUNT_PER_HOUR
                    : MIN_AMOUNT_PER_HOUR * conversionRates.USD.rates.GBP;
            const max =
                displaySymbol === "$"
                    ? MAX_AMOUNT_PER_HOUR
                    : MAX_AMOUNT_PER_HOUR * conversionRates.USD.rates.GBP;

            element.style.backgroundColor = rateToColor(rate, min, max);

            if (!element.classList.contains("pe-rate-highlight"))
                element.classList.add("pe-rate-highlight");
        }
    }
    async revert() {
        const elements =
            document.querySelectorAll<HTMLElement>(".pe-rate-highlight");
        for (const el of elements) {
            if (!el) continue;
            el.style.backgroundColor = "";
            el.classList.remove("pe-rate-highlight");
        }
    }
}

const highlightRatesEnhancement = new HighlightRatesEnhancement();
export { highlightRatesEnhancement };
