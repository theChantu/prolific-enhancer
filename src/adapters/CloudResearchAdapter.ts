import { BaseAdapter } from "./Adapter";
import { extractSymbol } from "../utils";

import type { AdapterSettings } from "./Adapter";

const CLOUD_RESEARCH_SETTINGS: AdapterSettings = {
    enableInterval: true,
};

export class CloudResearchAdapter extends BaseAdapter {
    constructor(overrides: Partial<AdapterSettings> = {}) {
        super(CLOUD_RESEARCH_SETTINGS, overrides);
    }

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

    getInitCurrencyInfo(el: HTMLElement) {
        return "$";
    }

    getCurrencyInfo(el: HTMLElement) {
        let displaySymbol = Array.from(el.classList).find((className) =>
            className.includes("current-"),
        );
        if (displaySymbol)
            displaySymbol = displaySymbol.replace("current-", "");

        return {
            displaySymbol: displaySymbol || null,
            // CloudResearch uses USD by default
            sourceSymbol: "$",
        };
    }

    getRewardElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                '[class*="project-pay-per-hour-"]',
            ),
        );
    }

    getHourlyRateElements() {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                '[class*="project-pay-per-hour-"]',
            ),
        ).filter((node) => node.textContent.includes("per hour"));
    }

    setHourlyRate(element: HTMLElement) {}
}
