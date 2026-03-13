import { BaseAdapter } from "./BaseAdapter";

import type { AdapterSettings } from "./BaseAdapter";
import type { ModuleName } from "./modules/BaseModule";
import type CurrencyConversion from "./modules/CurrencyConversion";

const CLOUD_RESEARCH_SETTINGS: AdapterSettings = {
    enableAutoReload: true,
};

export class CloudResearchAdapter
    extends BaseAdapter
    implements CurrencyConversion
{
    constructor(overrides: Partial<AdapterSettings> = {}) {
        super(
            {
                host: "connect.cloudresearch.com",
                path: "/participant/dashboard",
                suffix: "details",
                query: {
                    page: 1,
                    size: 100,
                },
            },
            CLOUD_RESEARCH_SETTINGS,
            overrides,
        );
    }

    override modules: readonly ModuleName[] = [
        "CurrencyConversion",
        "HighlightRates",
        "NewSurveyNotifications",
        "SurveyLinks",
        "UI",
    ];

    getSurveyElements() {
        return document.querySelectorAll<HTMLElement>("div.project-card");
    }

    getSurveyId(el: Element) {
        const surveyId = Array.from(el.classList).find((className) =>
            className.includes("project-card-"),
        );
        if (surveyId) return surveyId.replace("project-card-", "");
        return null;
    }

    getSurveyContainer(el: HTMLElement) {
        return el.querySelector<HTMLElement>("div.project-card");
    }

    getSurveyTitle(el: HTMLElement) {
        return el.querySelector<HTMLElement>("p") ?? null;
    }

    getInitCurrencyInfo(el: HTMLElement) {
        return "$";
    }

    getCurrencyInfo(el: HTMLElement) {
        let displaySymbol = Array.from(el.classList).find((className) =>
            className.startsWith("current-"),
        );
        if (displaySymbol)
            displaySymbol = displaySymbol.replace("current-", "");

        return {
            // CloudResearch uses USD by default
            displaySymbol:
                displaySymbol ?? this.getInitCurrencyInfo(el) ?? null,
            sourceSymbol: this.getInitCurrencyInfo(el) ?? null,
        };
    }

    getRewardElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                '[class*="project-pay-per-hour-"] > *',
            ),
        );
    }

    getRewardElement(el: HTMLElement) {
        return (
            el.querySelector<HTMLElement>(
                '[class*="project-pay-per-hour-"] > *',
            ) ?? null
        );
    }

    getHourlyRateElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                '[class*="project-pay-per-hour-"] > *:last-child',
            ),
        );
    }

    getHourlyRateElement(el: HTMLElement) {
        return (
            el.querySelector<HTMLElement>(
                '[class*="project-pay-per-hour-"] > *:last-child',
            ) ?? null
        );
    }

    setHourlyRate(element: HTMLElement) {}
}
