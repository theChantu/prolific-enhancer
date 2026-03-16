import store from "../store/store";
import { CONVERSION_RATES_FETCH_INTERVAL_MS } from "../constants";
import BaseEnhancement from "./BaseEnhancement";
import { defaultSiteSettings } from "../store/defaultSiteSettings";
import extractHourlyRate from "@/lib/extractHourlyRate";

import type { SiteSettings } from "../lib/types";

type ConversionRates = SiteSettings["conversionRates"];

async function fetchRates() {
    const { timestamp, ...conversionRates } = structuredClone(
        defaultSiteSettings.conversionRates,
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
        for (const c of currencies) {
            if (c === currency) continue;
            conversionRates[currency].rates[c] = data.rates[c];
        }
    }

    return conversionRates as ConversionRates;
}

function getSymbol(currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
    })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value;
}

class ConvertCurrencyEnhancement extends BaseEnhancement {
    async apply() {
        await this.updateRates();

        const elements = this.adapter.getRewardElements();
        const { selectedCurrency, conversionRates } = await store.get(
            this.adapter.siteName,
            ["selectedCurrency", "conversionRates"],
        );

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
                const sourceSymbol = this.adapter.getInitCurrencyInfo(element);

                element.classList.add(`source-${sourceSymbol}`);
                // TODO: Replace classes with attributes for easier access
                element.setAttribute("source", sourceSymbol ?? "");
            }

            const { sourceSymbol, displaySymbol } =
                this.adapter.getCurrencyInfo(element);

            if (sourceSymbol === selectedSymbol) {
                // Selected symbol matches source, so revert element text
                if (element.textContent !== sourceText) {
                    element.textContent = sourceText;
                }

                this.updateDisplay(element, `display-${sourceSymbol}`);
                continue;
            }

            this.updateDisplay(element, `display-${selectedSymbol}`);

            // Continue if currency is already converted
            if (displaySymbol === selectedSymbol) continue;

            const elementRate = extractHourlyRate(sourceText);
            const converted = `${selectedSymbol}${(elementRate * rate).toFixed(2)}`;

            element.textContent = sourceText.replace(
                /[$£€]?\s*\d+(?:\.\d+)?/,
                converted,
            );
        }
    }

    private async updateRates() {
        const { conversionRates } = await store.get(this.adapter.siteName, [
            "conversionRates",
        ]);

        const now = Date.now();
        if (
            now - conversionRates.timestamp <
            CONVERSION_RATES_FETCH_INTERVAL_MS
        )
            return;

        const newConversionRates = await fetchRates();
        newConversionRates.timestamp = now;

        await store.set(this.adapter.siteName, {
            conversionRates: newConversionRates,
        });
    }

    private updateDisplay(element: HTMLElement, display: string) {
        const previousClassName = Array.from(element.classList).find(
            (className) => className.startsWith("display-"),
        );
        if (previousClassName) {
            element.classList.remove(previousClassName);
        }
        element.classList.add(display);
    }

    async revert() {
        document.querySelectorAll("[data-original-text]").forEach((el) => {
            el.textContent = el.getAttribute("data-original-text") || "";
            el.removeAttribute("data-original-text");

            const displayClass = Array.from(el.classList).find((className) =>
                className.startsWith("display-"),
            );
            const sourceClass = Array.from(el.classList).find((className) =>
                className.startsWith("source-"),
            );

            if (displayClass) el.classList.remove(displayClass);
            if (sourceClass) el.classList.remove(sourceClass);
        });
    }
}

const convertCurrencyEnhancement = new ConvertCurrencyEnhancement();

export { convertCurrencyEnhancement };
