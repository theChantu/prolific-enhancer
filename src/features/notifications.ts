import store from "../store";
import { getSharedResources } from "../utils";
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

    const { surveys: immutableSurveys } = await store.get({ surveys: {} });
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

async function notifyNewSurveys() {
    const surveys = document.querySelectorAll<HTMLElement>(
        'li[data-testid^="study-"]',
    );
    if (surveys.length === 0) return;
    const assets = await getSharedResources();
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

export { notifyNewSurveys };
