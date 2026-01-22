// ==UserScript==
// @name         Prolific Enhancer
// @namespace    Violentmonkey Scripts
// @version      1.5
// @description  A lightweight userscript that makes finding worthwhile Prolific studies faster and less annoying.
// @author       Chantu
// @license      MIT
// @match        *://app.prolific.com/*
// @grant        GM.notification
// @grant        GM.getValue
// @grant        GM.getValues
// @grant        GM.setValue
// @grant        GM.setValues
// @grant        GM.openInTab
// @grant        GM.addStyle
// @grant        GM.getResourceUrl
// @resource     prolific_logo https://app.prolific.com/apple-touch-icon.png
// @downloadURL  https://github.com/theChantu/prolific-enhancer/raw/main/dist/prolific-enhancer.user.js
// ==/UserScript==

"use strict";
(() => {
  // src/store.ts
  var store = {
    async get(arg) {
      if (Array.isArray(arg)) {
        return GM.getValues([...arg]);
      }
      const keys = Object.keys(arg);
      const values = await GM.getValues(keys);
      return { ...arg, ...values };
    },
    set: async (values) => {
      await GM.setValues(values);
    }
  };
  var store_default = store;

  // src/features/links.ts
  function insertSurveyLinks() {
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

  // src/utils.ts
  var log = (...args) => {
    console.log("[Prolific Enhancer]", ...args);
  };
  var fetchResources = (...args) => {
    let promise = null;
    return () => {
      if (!promise) {
        promise = (async () => {
          const resources = {};
          for (const name of args) {
            const resource = await GM.getResourceUrl(name);
            if (!resource) continue;
            resources[name] = resource;
          }
          return resources;
        })();
      }
      return promise;
    };
  };
  var getSharedResources = fetchResources("prolific_logo");

  // src/constants.ts
  var NOTIFY_TTL_MS = 24 * 60 * 60 * 1e3;
  var GBP_TO_USD_FETCH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1e3;

  // src/features/notifications.ts
  async function saveSurveyFingerprint(fingerprint) {
    const now = Date.now();
    const { surveys: immutableSurveys } = await store_default.get({ surveys: {} });
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
    await store_default.set({ surveys });
    return true;
  }
  async function notifyNewSurveys() {
    const surveys = document.querySelectorAll(
      'li[data-testid^="study-"]'
    );
    if (surveys.length === 0) return;
    const assets = await getSharedResources();
    for (const survey of surveys) {
      const surveyId = survey.getAttribute("data-testid")?.replace("study-", "");
      if (!surveyId) continue;
      const isNewFingerprint = await saveSurveyFingerprint(surveyId);
      if (!isNewFingerprint || !document.hidden) continue;
      const surveyTitle = survey.querySelector("h2.title")?.textContent || "New Survey";
      const surveyReward = survey.querySelector("span.reward")?.textContent || "Unknown Reward";
      if (!surveyId) continue;
      const surveyLink = `https://app.prolific.com/studies/${surveyId}`;
      GM.notification({
        title: surveyTitle,
        text: surveyReward,
        image: assets["prolific_logo"],
        onclick: () => GM.openInTab(surveyLink, {
          active: true
        })
      });
    }
  }

  // src/features/rates.ts
  async function fetchGbpRate() {
    const response = await fetch("https://open.er-api.com/v6/latest/GBP");
    const data = await response.json();
    return data.rates.USD;
  }
  async function updateGbpRate() {
    const { gbpToUsd } = await store_default.get({
      gbpToUsd: { rate: 1.35, timestamp: 0 }
    });
    const now = Date.now();
    if (gbpToUsd && now - gbpToUsd.timestamp < GBP_TO_USD_FETCH_INTERVAL_MS)
      return;
    const rate = await fetchGbpRate().catch(console.error) || 1.35;
    await store_default.set({ gbpToUsd: { rate, timestamp: now } });
  }
  function extractHourlyRate(text) {
    const m = text.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : NaN;
  }
  function rateToColor(rate, min = 7, max = 15) {
    const clamped = Math.min(Math.max(rate, min), max);
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logRate = Math.log(clamped);
    const ratio = (logRate - logMin) / (logMax - logMin);
    const bias = Math.pow(ratio, 0.6);
    const r = Math.round(255 * (1 - bias));
    const g = Math.round(255 * bias);
    return `rgba(${r}, ${g}, 0, 0.63)`;
  }
  function highlightElement(element) {
    if (element.classList.contains("pe-rate-highlight")) return;
    const rate = extractHourlyRate(element.textContent);
    if (isNaN(rate)) return;
    element.style.backgroundColor = rateToColor(rate);
    element.classList.add("pe-rate-highlight");
  }
  function highlightHourlyRates() {
    const elements = document.querySelectorAll(
      "[data-testid='study-tag-reward-per-hour']"
    );
    for (const element of elements) {
      if (element.getAttribute("data-testid") === "study-tag-reward") {
        continue;
      }
      highlightElement(element);
    }
  }
  function extractSymbol(text) {
    const m = text.match(/[£$€]/);
    return m ? m[0] : null;
  }
  async function convertGbpToUsd() {
    const elements = document.querySelectorAll("span.reward span");
    const { gbpToUsd } = await store_default.get({
      gbpToUsd: { rate: 1.35, timestamp: 0 }
    });
    const { rate } = gbpToUsd;
    for (const element of elements) {
      const symbol = extractSymbol(element.textContent);
      if (symbol !== "\xA3") continue;
      const elementRate = extractHourlyRate(element.textContent);
      let modified = `$${(elementRate * rate).toFixed(2)}`;
      if (element.textContent.includes("/hr")) modified += "/hr";
      element.textContent = modified;
    }
  }

  // src/main.ts
  (async function() {
    "use strict";
    log("Loaded.");
    const { initialized } = await store_default.get({ initialized: false });
    if (!initialized) {
      await store_default.set({
        surveys: {},
        gbpToUsd: { rate: 1.35, timestamp: 0 },
        initialized: true
      });
    }
    GM.addStyle(`
        .pe-custom-btn {
            padding: 8px 24px;
            border-radius: 4px;
            font-size: 0.9em;
            background-color: #0a3c95;
            color: white;
            cursor: pointer;
            text-decoration: none;
        }
        .pe-custom-btn:hover {
            background-color: #0d4ebf;
            color: white !important;
        }
        .pe-btn-container {
            padding: 0 16px 8px 16px;
        }
        .pe-rate-highlight {
            padding: 3px 4px;
            border-radius: 4px;
            color: black;
        }
    `);
    function debounce(fn, delay = 300) {
      let timeoutId;
      let runId = 0;
      return (...args) => {
        runId++;
        const currentRun = runId;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (currentRun !== runId) return;
          Promise.resolve(fn(...args)).catch(console.error);
        }, delay);
      };
    }
    async function runEnhancements() {
      await updateGbpRate();
      await convertGbpToUsd();
      highlightHourlyRates();
      insertSurveyLinks();
      await notifyNewSurveys();
    }
    await runEnhancements();
    const debounced = debounce(async () => {
      await runEnhancements();
    }, 300);
    const observer = new MutationObserver(async (mutations) => {
      const hasChanges = mutations.some(
        (m) => m.addedNodes.length > 0 || m.removedNodes.length > 0
      );
      if (!hasChanges) return;
      debounced();
    });
    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
  })();
})();
