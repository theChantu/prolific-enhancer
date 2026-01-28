import store from "../store/store";
import { getSharedResources } from "../utils";
import { NOTIFY_TTL_MS } from "../constants";
import type { Enhancement } from "../types";

async function saveSurveyFingerprint(fingerprint: string) {
    const now = Date.now();

    const { surveys: immutableSurveys } = await store.get(["surveys"]);
    const surveys = structuredClone(immutableSurveys);

    for (const [key, timestamp] of Object.entries(surveys)) {
        if (now - timestamp >= NOTIFY_TTL_MS) {
            delete surveys[key];
        }
    }

    if (surveys[fingerprint]) {
        return false;
    }

    surveys[fingerprint] = now;
    await store.set({ surveys });

    return true;
}

function validSurveyToNotify() {}

class NewSurveyNotificationsEnhancement implements Enhancement {
    async apply() {
        const surveys = document.querySelectorAll<HTMLElement>(
            'li[data-testid^="study-"]',
        );
        if (surveys.length === 0) return;
        const assets = await getSharedResources();
        for (const survey of surveys) {
            const surveyId = survey
                .getAttribute("data-testid")
                ?.replace("study-", "");
            if (!surveyId) continue;
            const isNewFingerprint = await saveSurveyFingerprint(surveyId);
            if (!isNewFingerprint || !document.hidden) continue;

            const surveyTitle =
                survey.querySelector("h2.title")?.textContent || "New Survey";
            const surveyReward =
                survey.querySelector("span.reward")?.textContent ||
                "Unknown Reward";
            if (!surveyId) continue;
            const surveyLink = `https://app.prolific.com/studies/${surveyId}`;
            GM.notification({
                title: surveyTitle,
                text: surveyReward,
                image: assets["prolific_logo"],
                onclick: () =>
                    GM.openInTab(surveyLink, {
                        active: true,
                    }),
            });
        }
    }

    revert() {
        // No cleanup necessary for notifications
    }
}

const newSurveyNotificationsEnhancement =
    new NewSurveyNotificationsEnhancement();

export { newSurveyNotificationsEnhancement };
