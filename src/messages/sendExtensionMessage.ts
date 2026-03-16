import { browser, type Browser } from "#imports";
import type { MessageMap, MessageResponse, Message } from "./types";

export function sendExtensionMessage<K extends keyof MessageMap>(
    message: Message<K>,
): Promise<MessageResponse<K>>;

export function sendExtensionMessage<K extends keyof MessageMap>(
    extensionId: string,
    message: Message<K>,
): Promise<MessageResponse<K>>;

export function sendExtensionMessage<K extends keyof MessageMap>(
    extensionId: string,
    message: Message<K>,
    options: Browser.runtime.MessageOptions,
): Promise<MessageResponse<K>>;

export function sendExtensionMessage<K extends keyof MessageMap>(
    arg1: string | Message<K>,
    arg2?: Message<K>,
    arg3?: Browser.runtime.MessageOptions,
) {
    if (typeof arg1 === "string") {
        if (arg3 !== undefined) {
            return browser.runtime.sendMessage(arg1, arg2!, arg3);
        }
        return browser.runtime.sendMessage(arg1, arg2!);
    }

    return browser.runtime.sendMessage(arg1);
}
