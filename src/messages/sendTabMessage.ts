import { browser, type Browser } from "#imports";
import type { MessageMap, Message } from "./types";

export function sendTabMessage<K extends keyof MessageMap>(
    tabId: number,
    message: Message<K>,
    options?: Browser.tabs.MessageSendOptions,
): Promise<unknown> {
    if (options !== undefined) {
        return browser.tabs.sendMessage(tabId, message, options);
    }
    return browser.tabs.sendMessage(tabId, message);
}
