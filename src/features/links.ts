import type { Enhancement } from "../types";

class SurveyLinksEnhancement implements Enhancement {
    apply() {
        const surveys = document.querySelectorAll('li[data-testid^="study-"]');
        for (const survey of surveys) {
            const testid = survey.getAttribute("data-testid");
            if (!testid) continue;
            const surveyId = testid.replace("study-", "");
            const studyContent = survey.querySelector("div.study-content");
            if (studyContent && !studyContent.querySelector(".pe-link")) {
                const container = document.createElement("div");
                const link = document.createElement("a");
                container.className = "pe-btn-container";
                container.appendChild(link);
                link.className = "pe-link pe-custom-btn";
                link.href = `https://app.prolific.com/studies/${surveyId}`;
                link.textContent = "Take part in this study";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                studyContent.appendChild(container);
            }
        }
    }

    revert() {
        document
            .querySelectorAll(".pe-btn-container")
            .forEach((el) => el.remove());
    }
}

const surveyLinksEnhancement = new SurveyLinksEnhancement();
export { surveyLinksEnhancement };
