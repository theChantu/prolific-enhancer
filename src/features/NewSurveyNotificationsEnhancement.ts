import store from "../store/store";
import { capitalize } from "../lib/utils";
import { NOTIFY_TTL_MS } from "../constants";
import BaseEnhancement from "./BaseEnhancement";
import getSiteResources from "../lib/getSiteResources";
import { sendExtensionMessage } from "@/messages/sendExtensionMessage";

class NewSurveyNotificationsEnhancement extends BaseEnhancement {
    async apply() {
        const surveys = this.adapter.getSurveyElements();
        if (surveys.length === 0) return;

        const assets = await getSiteResources();
        const surveyFingerprints = this.extractSurveyFingerprints(surveys);
        const newSurveys =
            await this.saveSurveyFingerprints(surveyFingerprints);

        for (const survey of surveys) {
            const surveyId = this.adapter.getSurveyId(survey);
            if (!surveyId || !newSurveys.includes(surveyId) || !document.hidden)
                continue;

            await sendExtensionMessage({
                type: "survey-notification",
                data: this.buildNotification(survey, surveyId, assets),
            });
        }
    }

    private async saveSurveyFingerprints(fingerprints: string[]) {
        const now = Date.now();

        const { surveys: immutableSurveys } = await store.get(
            this.adapter.siteName,
            ["surveys"],
        );
        const prevSurveys = structuredClone(immutableSurveys);

        let changed = false;
        // TTL removals
        for (const [key, timestamp] of Object.entries(prevSurveys)) {
            if (now - timestamp >= NOTIFY_TTL_MS) {
                delete prevSurveys[key];
                changed = true;
            }
        }

        const newSurveys: string[] = [];
        for (const fingerprint of fingerprints) {
            if (!(fingerprint in prevSurveys)) {
                newSurveys.push(fingerprint);
                prevSurveys[fingerprint] = now;
                changed = true;
            }
        }

        if (changed)
            await store.set(this.adapter.siteName, { surveys: prevSurveys });

        return newSurveys;
    }

    private extractSurveyFingerprints(surveys: NodeListOf<HTMLElement>) {
        return Array.from(surveys)
            .map((survey) => this.adapter.getSurveyId(survey))
            .filter((id): id is string => id !== undefined);
    }

    private extractSurveyRate(survey: HTMLElement) {
        return survey.textContent?.match(/\d+(\.\d+)?/)?.[0];
    }

    private buildNotification(
        survey: HTMLElement,
        surveyId: string,
        assets: Awaited<ReturnType<typeof getSiteResources>>,
    ) {
        const surveyTitle = this.adapter.getSurveyTitle(survey)?.textContent;
        const rewardElement = this.adapter.getRewardElement(survey);
        const hourlyRateElement = this.adapter.getHourlyRateElement(survey);
        const displaySymbol = rewardElement
            ? this.adapter.getCurrencyInfo(rewardElement).displaySymbol
            : "";
        const rewardText =
            (rewardElement && this.extractSurveyRate(rewardElement)) ||
            "Unknown reward";
        const hourlyRateText =
            (hourlyRateElement && this.extractSurveyRate(hourlyRateElement)) ||
            "Unknown rate";

        const { path, suffix } = this.adapter.url;
        const surveyLink = this.adapter.buildUrl([
            path,
            surveyId,
            ...(suffix ? [suffix] : []),
        ]);

        const siteLabel = capitalize(this.adapter.siteName);

        const notificationData = {
            title: surveyTitle || siteLabel,
            message: `${siteLabel} • ${displaySymbol}${rewardText} • ${displaySymbol}${hourlyRateText}/hr`,
            iconUrl: assets[this.adapter.iconUrl],
            surveyLink,
        };
        return notificationData;
    }

    async revert() {
        // No cleanup necessary for notifications
    }
}

const newSurveyNotificationsEnhancement =
    new NewSurveyNotificationsEnhancement();

export { newSurveyNotificationsEnhancement };
