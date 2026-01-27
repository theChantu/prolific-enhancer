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
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @resource     prolific_logo https://app.prolific.com/apple-touch-icon.png
// @downloadURL  https://github.com/theChantu/prolific-enhancer/raw/main/dist/prolific-enhancer.user.js
// ==/UserScript==

"use strict";
(() => {
  // src/store/defaults.ts
  var defaultVMSettings = Object.freeze({
    conversionRates: {
      timestamp: 0,
      USD: { rates: { GBP: 0.74, USD: 1 } },
      GBP: { rates: { USD: 1.35, GBP: 1 } }
    },
    selectedCurrency: "USD",
    enableCurrencyConversion: true,
    enableHighlightRates: true,
    enableSurveyLinks: true,
    enableNewSurveyNotifications: true,
    surveys: {}
  });

  // src/store/store.ts
  function createStore() {
    const listeners = /* @__PURE__ */ new Set();
    return {
      get: async (keys) => {
        const values = await GM.getValues([...keys]);
        return Object.fromEntries(
          keys.map((k) => [k, values[k] ?? defaultVMSettings[k]])
        );
      },
      set: async (values) => {
        await GM.setValues(values);
        for (const listener of listeners) listener(values);
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
  }
  var store = createStore();
  var store_default = store;

  // src/features/links.ts
  var SurveyLinksEnhancement = class {
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
      document.querySelectorAll(".pe-btn-container").forEach((el) => el.remove());
    }
  };
  var surveyLinksEnhancement = new SurveyLinksEnhancement();

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
  var CONVERSION_RATES_FETCH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1e3;
  var MIN_AMOUNT_PER_HOUR = 7;
  var MAX_AMOUNT_PER_HOUR = 15;

  // src/features/notifications.ts
  async function saveSurveyFingerprint(fingerprint) {
    const now = Date.now();
    const { surveys: immutableSurveys } = await store_default.get(["surveys"]);
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
  var NewSurveyNotificationsEnhancement = class {
    async apply() {
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
    revert() {
    }
  };
  var newSurveyNotificationsEnhancement = new NewSurveyNotificationsEnhancement();

  // src/features/rates.ts
  var fallbackRates = Object.freeze({
    ...defaultVMSettings.conversionRates
  });
  async function fetchRates() {
    const currencies = Object.keys(
      fallbackRates
    );
    const conversionRates = {
      ...fallbackRates
    };
    for (const currency of currencies) {
      try {
        const response = await fetch(
          `https://open.er-api.com/v6/latest/${currency}`
        );
        const data = await response.json();
        for (const c of currencies) {
          if (c === currency) continue;
          conversionRates[currency].rates[c] = data.rates[c];
        }
      } catch (error) {
        console.error(error);
      }
    }
    return conversionRates;
  }
  async function updateRates() {
    const { conversionRates } = await store_default.get(["conversionRates"]);
    const now = Date.now();
    if (now - conversionRates.timestamp < CONVERSION_RATES_FETCH_INTERVAL_MS)
      return;
    const newConversionRates = await fetchRates();
    newConversionRates.timestamp = now;
    await store_default.set({
      conversionRates: newConversionRates
    });
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
  function extractSymbol(text) {
    const m = text.match(/[£$€]/);
    return m ? m[0] : null;
  }
  function getSymbol(currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).formatToParts(0).find((part) => part.type === "currency")?.value;
  }
  var ConvertCurrencyEnhancement = class {
    async apply() {
      const elements = document.querySelectorAll("span.reward span");
      const { selectedCurrency, conversionRates } = await store_default.get([
        "selectedCurrency",
        "conversionRates"
      ]);
      const selectedSymbol = getSymbol(selectedCurrency);
      const rate = selectedCurrency === "USD" ? conversionRates.GBP.rates.USD : conversionRates.USD.rates.GBP;
      for (const element of elements) {
        let sourceText = element.getAttribute("data-original-text");
        if (!sourceText) {
          element.setAttribute(
            "data-original-text",
            element.textContent || ""
          );
          sourceText = element.textContent || "";
        }
        const currentSymbol = extractSymbol(element.textContent);
        const sourceSymbol = extractSymbol(sourceText);
        if (sourceSymbol === selectedCurrency && element.textContent !== sourceText) {
          element.textContent = sourceText;
          continue;
        }
        if (currentSymbol === selectedSymbol) continue;
        const elementRate = extractHourlyRate(element.textContent);
        let modified = `${selectedSymbol}${(elementRate * rate).toFixed(2)}`;
        if (element.textContent.includes("/hr")) modified += "/hr";
        element.textContent = modified;
      }
    }
    revert() {
      document.querySelectorAll("span[data-original-text]").forEach((el) => {
        el.textContent = el.getAttribute("data-original-text") || "";
        el.removeAttribute("data-original-text");
      });
    }
  };
  var HighlightRatesEnhancement = class {
    async apply() {
      const elements = document.querySelectorAll(
        "[data-testid='study-tag-reward-per-hour']"
      );
      for (const element of elements) {
        if (element.getAttribute("data-testid") === "study-tag-reward") {
          continue;
        }
        const rate = extractHourlyRate(element.textContent);
        const symbol = extractSymbol(element.textContent);
        if (isNaN(rate) || !symbol) return;
        const { conversionRates } = await store_default.get(["conversionRates"]);
        const min = symbol === "$" ? MIN_AMOUNT_PER_HOUR : MIN_AMOUNT_PER_HOUR * conversionRates.USD.rates.GBP;
        const max = symbol === "$" ? MAX_AMOUNT_PER_HOUR : MAX_AMOUNT_PER_HOUR * conversionRates.USD.rates.GBP;
        element.style.backgroundColor = rateToColor(rate, min, max);
        if (!element.classList.contains("pe-rate-highlight"))
          element.classList.add("pe-rate-highlight");
      }
    }
    revert() {
      document.querySelectorAll(".pe-rate-highlight").forEach((el) => {
        el.style.backgroundColor = "";
        el.classList.remove("pe-rate-highlight");
      });
    }
  };
  var highlightRatesEnhancement = new HighlightRatesEnhancement();
  var convertCurrencyEnhancement = new ConvertCurrencyEnhancement();

  // src/main.ts
  (async function() {
    "use strict";
    log("Loaded.");
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
      const {
        enableCurrencyConversion = true,
        enableHighlightRates = true,
        enableSurveyLinks = true,
        enableNewSurveyNotifications = true
      } = await store_default.get([
        "enableCurrencyConversion",
        "enableHighlightRates",
        "enableSurveyLinks",
        "enableNewSurveyNotifications"
      ]);
      await Promise.all([
        !enableCurrencyConversion && convertCurrencyEnhancement.revert(),
        !enableHighlightRates && highlightRatesEnhancement.revert(),
        !enableSurveyLinks && surveyLinksEnhancement.revert(),
        !enableNewSurveyNotifications && newSurveyNotificationsEnhancement.revert()
      ]);
      if (enableCurrencyConversion) {
        await updateRates();
      }
      await Promise.all([
        enableCurrencyConversion && convertCurrencyEnhancement.apply(),
        enableHighlightRates && highlightRatesEnhancement.apply(),
        enableSurveyLinks && surveyLinksEnhancement.apply(),
        enableNewSurveyNotifications && newSurveyNotificationsEnhancement.apply()
      ]);
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
    function createMenuCommandRefresher() {
      const commandIds = [];
      return async function refreshMenuCommands2() {
        for (const id2 of commandIds) {
          GM.unregisterMenuCommand(id2);
        }
        commandIds.length = 0;
        const settings = await store_default.get(
          Object.keys(
            defaultVMSettings
          )
        );
        const { selectedCurrency } = settings;
        const id = GM.registerMenuCommand(
          `Currency: ${selectedCurrency}`,
          async () => {
            await store_default.set({
              selectedCurrency: selectedCurrency === "USD" ? "GBP" : "USD"
            });
            await runEnhancements();
          }
        );
        commandIds.push(id);
        const toggleSettings = Object.keys(settings).filter(
          (key) => key.startsWith("enable")
        );
        for (const setting of toggleSettings) {
          const formattedSettingName = setting.replace("enable", "").split(/(?=[A-Z])/).join(" ");
          const id2 = GM.registerMenuCommand(
            `${settings[setting] ? "Disable" : "Enable"} ${formattedSettingName}`,
            async () => {
              await store_default.set({
                [setting]: !settings[setting]
              });
              await runEnhancements();
            }
          );
          commandIds.push(id2);
        }
      };
    }
    const refreshMenuCommands = createMenuCommandRefresher();
    await refreshMenuCommands();
    const unsubscribe = store_default.subscribe(async (changed) => {
      await refreshMenuCommands();
    });
  })();
})();
