import { browser } from "#imports";
import { onExtensionMessage } from "@/messages/onExtensionMessage";
import { sendTabMessage } from "@/messages/sendTabMessage";
import { createStore } from "@/store/createStore";
import { adapterHosts } from "@/adapters/hosts";
import getSiteAdapter from "@/lib/getSiteAdapter";

function runBackgroundScript() {
    const notificationActions = new Map<string, () => void | Promise<void>>();

    browser.notifications.onClicked.addListener(async (id) => {
        const action = notificationActions.get(id);
        if (!action) return;
        await action();

        notificationActions.delete(id);
        await browser.notifications.clear(id);
    });

    browser.notifications.onClosed.addListener(async (id) => {
        notificationActions.delete(id);
    });

    onExtensionMessage("survey-notification", async (payload) => {
        const { iconUrl, title, message, surveyLink } = payload;
        const notificationId = await browser.notifications.create({
            type: "basic",
            iconUrl: iconUrl ?? "",
            title,
            message,
        });

        notificationActions.set(notificationId, async () => {
            await browser.tabs.create({
                active: true,
                url: surveyLink,
            });
        });
    });

    const store = createStore();

    onExtensionMessage("store-fetch", async (payload) => {
        const { url, settings } = payload;
        const adapter = getSiteAdapter(url);
        if (!adapter) return null;

        const data = await store.get(adapter.siteName, settings);
        return { siteName: adapter.siteName, data };
    });

    store.subscribe("globals", async (changed) => {
        const tabs = await browser.tabs.query({});

        for (const tab of tabs) {
            if (!tab.id || !tab.url) continue;
            if (!adapterHosts.some((host) => tab.url!.includes(host))) continue;

            await sendTabMessage(tab.id, {
                type: "store-changed",
                data: changed,
            });
        }
    });

    store.subscribe("site", async (siteName, changed) => {
        const tabs = await browser.tabs.query({});

        for (const tab of tabs) {
            if (!tab.id || !tab.url) continue;
            if (!tab.url.includes(siteName)) continue;

            await sendTabMessage(tab.id, {
                type: "store-changed",
                data: changed,
            });
        }
    });

    onExtensionMessage("store-update", async (payload) => {
        const { siteName, ...settings } = payload;
        await store.update(siteName, settings);
    });
}

export { runBackgroundScript };
