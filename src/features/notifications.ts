import type { Surveys } from "../types";
import store from "../store";
import { NOTIFY_TTL_MS } from "../constants";

function getSurveyFingerprint(surveyElement: HTMLElement) {
    const surveyId = surveyElement.dataset.testid;
    if (!surveyId) return null;
    return surveyId;
}

async function saveSurveyFingerprint(surveyElement: HTMLElement) {
    const fingerprint = getSurveyFingerprint(surveyElement);
    if (!fingerprint) return false;
    const now = Date.now();

    const entries = await store.get<Surveys>("surveys", {});

    for (const [key, timestamp] of Object.entries(entries) as Array<
        [keyof Surveys, Surveys[keyof Surveys]]
    >) {
        if (now - timestamp >= NOTIFY_TTL_MS) {
            delete entries[key];
        }
    }

    if (entries[fingerprint]) {
        return false;
    }

    entries[fingerprint] = now;
    await store.set("surveys", entries);

    return true;
}

async function notifyNewSurveys() {
    const surveys = document.querySelectorAll<HTMLElement>(
        'li[data-testid^="study-"]',
    );
    for (const survey of surveys) {
        const isNewFingerprint = await saveSurveyFingerprint(survey);
        if (!isNewFingerprint || !document.hidden) continue;

        const surveyId = survey
            .getAttribute("data-testid")
            ?.replace("study-", "");
        const surveyTitle =
            survey.querySelector("h2.title")?.textContent || "New Survey";
        const surveyReward =
            survey.querySelector("span.reward")?.textContent ||
            "Unknown Reward";
        if (!surveyId) continue;
        const surveyLink = `https://app.prolific.com/studies/${surveyId}`;
        const prolificLogo = await GM.getResourceUrl("prolific_logo");
        GM.notification({
            title: surveyTitle,
            text: surveyReward,
            image: prolificLogo,
            onclick: () =>
                GM.openInTab(surveyLink, {
                    active: true,
                }),
        });
    }
}

export { notifyNewSurveys };
