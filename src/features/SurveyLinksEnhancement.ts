import BaseEnhancement from "./BaseEnhancement";

class SurveyLinksEnhancement extends BaseEnhancement {
    constructor() {
        super();
    }

    async apply() {
        const surveys = this.adapter.getSurveyElements();
        for (const survey of surveys) {
            const surveyId = this.adapter.getSurveyId(survey);
            const studyContent = this.adapter.getSurveyContainer(survey);

            if (!surveyId) continue;

            const { path, suffix } = this.adapter.url;
            const surveyLink = this.adapter.buildUrl([
                path,
                surveyId,
                ...(suffix ? [suffix] : []),
            ]);

            if (studyContent && !studyContent.querySelector(".pe-link")) {
                const container = document.createElement("div");
                const link = document.createElement("a");
                container.className = "pe-btn-container";
                container.appendChild(link);
                link.className = "pe-link pe-custom-btn";
                link.href = surveyLink;
                link.textContent = "Take part in this study";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                studyContent.appendChild(container);
            }
        }
    }

    async revert() {
        const elements = document.querySelectorAll(".pe-btn-container");
        for (const el of elements) {
            if (!el) continue;
            el.remove();
        }
    }
}

const surveyLinksEnhancement = new SurveyLinksEnhancement();
export { surveyLinksEnhancement };
