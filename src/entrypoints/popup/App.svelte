<script lang="ts">
    import { defaultSettings } from "@/store/defaultSettings";
    import { sendExtensionMessage } from "@/messages/sendExtensionMessage";
    import Toggle from "@/components/Toggle.svelte";
    import {
        Settings as SettingsIcon,
        CircleDollarSign,
        CircleAlert,
        ChevronDown,
        Bell,
        Bug,
        LoaderCircle,
    } from "@lucide/svelte";

    import type { Settings, SettingsUpdate } from "@/store/createStore";

    let invalidUrl = false;
    let siteName = "";
    let settings: Settings | null = null;

    function updateSetting(values: SettingsUpdate) {
        if (!siteName || !settings) return;
        settings = { ...settings, ...values };
        sendExtensionMessage({
            type: "store-update",
            data: { siteName, ...values },
        });
    }

    onMount(() => {
        (async () => {
            const [tab] = await browser.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (!tab.id || !tab.url) {
                invalidUrl = true;
                return;
            }

            try {
                const response = await sendExtensionMessage({
                    type: "store-fetch",
                    data: {
                        url: tab.url,
                        settings: Object.keys(
                            defaultSettings,
                        ) as (keyof Settings)[],
                    },
                });

                if (!response) {
                    invalidUrl = true;
                    return;
                }

                siteName = response.siteName;
                settings = response.data;
            } catch {
                invalidUrl = true;
            }
        })();
    });
</script>

{#if invalidUrl}
    <div class="popup">
        <div class="card error-card">
            <CircleAlert size={22} strokeWidth={2} />
            <div>
                <div class="error-title">Unsupported site</div>
                <div class="error-description">
                    Navigate to a supported site to configure settings.
                </div>
            </div>
        </div>
    </div>
{:else if !settings}
    <div class="popup">
        <div class="card loading-card">
            <LoaderCircle size={18} class="spinner-icon" />
            <span>Loading settings...</span>
        </div>
    </div>
{:else}
    <div class="popup">
        <div class="header">
            <h1>{siteName}</h1>
        </div>

        <div class="card section">
            <h2>
                <SettingsIcon size={14} strokeWidth={2.5} />
                General
            </h2>

            <Toggle
                title="Survey links"
                description="Show direct survey links when available."
                value={settings.enableSurveyLinks}
                onClick={() =>
                    updateSetting({
                        enableSurveyLinks: !settings?.enableSurveyLinks,
                    })}
            />

            <Toggle
                title="Highlight rates"
                description="Visually emphasize stronger survey rates."
                value={settings.enableHighlightRates}
                onClick={() =>
                    updateSetting({
                        enableHighlightRates: !settings?.enableHighlightRates,
                    })}
            />
        </div>

        <div class="card section">
            <h2>
                <CircleDollarSign size={14} strokeWidth={2.5} />
                Currency
            </h2>
            <Toggle
                title="Currency conversion"
                description="Convert rewards into your selected currency."
                value={settings.enableCurrencyConversion}
                onClick={() =>
                    updateSetting({
                        enableCurrencyConversion:
                            !settings?.enableCurrencyConversion,
                    })}
            />
            <div class="field">
                <label for="currency">Selected currency</label>
                <div class="select-wrap">
                    <select
                        id="currency"
                        bind:value={settings.selectedCurrency}
                        on:change={(e) =>
                            updateSetting({
                                selectedCurrency: e.currentTarget
                                    .value as Settings["selectedCurrency"],
                            })}
                    >
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                    </select>
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>

        <div class="card section">
            <h2>
                <Bell size={14} strokeWidth={2.5} />
                Notifications
            </h2>
            <Toggle
                title="New survey notifications"
                description="Send a desktop notification when a new survey appears."
                value={settings.enableNewSurveyNotifications}
                onClick={() =>
                    updateSetting({
                        enableNewSurveyNotifications:
                            !settings?.enableNewSurveyNotifications,
                    })}
            />
        </div>

        <div class="card section">
            <h2>
                <Bug size={14} strokeWidth={2.5} />
                Developer
            </h2>
            <Toggle
                title="Debug mode"
                description="Log extension activity to the browser console."
                value={settings.enableDebug}
                onClick={() =>
                    updateSetting({
                        enableDebug: !settings?.enableDebug,
                    })}
            />
        </div>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        min-width: 340px;
        background: #121417;
        color: #d1d5db;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        -webkit-font-smoothing: antialiased;
    }

    .popup {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .header h1 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #f3f4f6;
        text-transform: capitalize;
    }

    .card {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 12px;
    }

    .section h2 {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 8px;
        font-size: 0.7rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .field label {
        font-size: 0.78rem;
        font-weight: 500;
        color: #6b7280;
    }

    .select-wrap {
        position: relative;
        color: #6b7280;
    }

    .select-wrap :global(svg) {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
    }

    select {
        width: 100%;
        padding: 8px 32px 8px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        color: #d1d5db;
        font-size: 0.82rem;
        font-family: inherit;
        outline: none;
        appearance: none;
        cursor: pointer;
    }

    select option {
        background: #1a1d21;
        color: #d1d5db;
    }

    select:focus {
        border-color: rgba(255, 255, 255, 0.2);
    }

    .loading-card {
        padding: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #6b7280;
        font-size: 0.82rem;
    }

    .loading-card :global(.spinner-icon) {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-card {
        padding: 20px 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        color: #ef4444;
    }

    .error-card :global(svg) {
        flex-shrink: 0;
        margin-top: 1px;
    }

    .error-title {
        font-size: 0.86rem;
        font-weight: 600;
        color: #fca5a5;
    }

    .error-description {
        margin-top: 2px;
        font-size: 0.76rem;
        line-height: 1.4;
        color: #6b7280;
    }
</style>
