import store from "../store/store";
import type { Enhancement } from "../types";
import type { StoreListener } from "../store/store";
import { clamp } from "../utils";
import { defaultVMSettings } from "../store/defaults";

function formatSettingString(setting: string) {
    return setting
        .replace("enable", "")
        .split(/(?=[A-Z])/)
        .join(" ");
}

class UIEnhancement implements Enhancement {
    controller: AbortController;

    constructor() {
        this.controller = new AbortController();
    }

    async apply() {
        if (document.querySelector("#pe-ui-container")) return;

        const body = document.querySelector("body");

        const container = document.createElement("div");
        body?.appendChild(container);
        container.id = "pe-ui-container";

        const title = document.createElement("div");
        container?.appendChild(title);
        title.id = "pe-ui-title";
        title.textContent = "Prolific Enhancer Settings";

        const settingsContainer = document.createElement("div");
        container?.appendChild(settingsContainer);
        settingsContainer.id = "pe-settings-container";

        const settings = await store.get(
            Object.keys(
                defaultVMSettings,
            ) as (keyof typeof defaultVMSettings)[],
        );

        const createSettingElement = (
            labelText: string,
            buttonText: string,
            setting: keyof typeof defaultVMSettings,
            onClick: () => Promise<void>,
        ) => {
            const toggleContainer = document.createElement("div");
            toggleContainer.className = "pe-setting-item";
            toggleContainer.dataset.setting = setting;
            const toggleButton = document.createElement("button");
            const label = document.createElement("div");
            label.textContent = labelText;
            toggleButton.textContent = buttonText;
            toggleContainer.append(label, toggleButton);
            toggleButton.addEventListener("click", onClick);
            return toggleContainer;
        };

        // Currency command
        const { selectedCurrency } = settings;
        const toggleElement = createSettingElement(
            "Selected Currency",
            `Currency: ${selectedCurrency}`,
            "selectedCurrency",
            async () => {
                const { selectedCurrency } = await store.get([
                    "selectedCurrency",
                ]);
                await store.set({
                    selectedCurrency:
                        selectedCurrency === "USD" ? "GBP" : "USD",
                });
            },
        );
        settingsContainer.append(toggleElement);

        const toggleSettings = Object.keys(settings).filter((key) =>
            key.startsWith("enable"),
        ) as (keyof typeof defaultVMSettings)[];
        for (const setting of toggleSettings) {
            const formattedSettingName = formatSettingString(setting);

            // Toggle commands
            const toggleElement = createSettingElement(
                formattedSettingName,
                `${settings[setting] ? "Disable" : "Enable"} ${formattedSettingName}`,
                setting,
                async () => {
                    const current = await store.get([setting]);
                    await store.set({
                        [setting]: !current[setting],
                    });
                },
            );
            settingsContainer.append(toggleElement);
        }

        const {
            ui: {
                initialized,
                position: { left, top },
            },
        } = await store.get(["ui"]);

        Object.assign(container.style, {
            // Set to center if position is not initialized
            left: `${!initialized ? window.innerWidth / 2 : left}px`,
            top: `${!initialized ? window.innerHeight / 2 : top}px`,
        });

        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const { signal } = this.controller;

        const updatePosition = (x?: number, y?: number) => {
            const { left, top, width, height } =
                container.getBoundingClientRect();
            container.style.left = `${clamp(x ?? left, 0, window.innerWidth - width)}px`;
            container.style.top = `${clamp(y ?? top, 0, window.innerHeight - height)}px`;
        };

        container.addEventListener(
            "mousedown",
            (e) => {
                e.preventDefault();
                isDragging = true;
                container.style.cursor = "grabbing";

                const { left, top } = container.getBoundingClientRect();
                offsetX = e.clientX - left;
                offsetY = e.clientY - top;

                updatePosition(left, top);
            },
            { signal },
        );

        window.addEventListener("resize", () => updatePosition(), { signal });

        document.addEventListener(
            "mousemove",
            (e) => {
                if (!isDragging) return;

                updatePosition(e.clientX - offsetX, e.clientY - offsetY);
            },
            { signal },
        );

        document.addEventListener(
            "mouseup",
            () => {
                isDragging = false;
                container.style.cursor = "grab";

                // Save position
                const { left, top } = container.getBoundingClientRect();
                store.set({
                    ui: {
                        initialized: true,
                        position: { left, top },
                    },
                });
            },
            { signal },
        );
    }

    update(changed: Parameters<StoreListener>[0]) {
        if (!document.getElementById("pe-ui-container")) return;

        const settingsElements = document.querySelectorAll<HTMLElement>(
            ".pe-setting-item[data-setting]",
        );
        if (settingsElements.length === 0) return;

        const keys = Object.keys(changed) as (keyof typeof changed)[];
        for (const el of settingsElements) {
            const setting = el.dataset.setting as keyof typeof changed;
            if (!keys.includes(setting)) continue;

            if (
                changed.selectedCurrency &&
                setting === ("selectedCurrency" as keyof typeof changed)
            ) {
                const { selectedCurrency } = changed;
                const button = el.querySelector("button");
                if (!button) continue;
                button.textContent = `Currency: ${selectedCurrency}`;
            }

            if (setting.startsWith("enable")) {
                const value = changed[setting];
                const button = el.querySelector("button");
                if (!button) continue;
                const formattedSettingName = formatSettingString(setting);
                button.textContent = `${value ? "Disable" : "Enable"} ${formattedSettingName}`;
            }
        }
    }

    async revert() {
        const container = document.getElementById("pe-ui-container");
        container?.remove();
        this.controller.abort();
        this.controller = new AbortController();
    }
}

const uiEnhancement = new UIEnhancement();
export { uiEnhancement };
