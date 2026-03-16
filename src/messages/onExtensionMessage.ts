import type {
    MessageMap,
    MessageResponse,
    HandlerPayload,
    Message,
} from "./types";

export function onExtensionMessage<K extends keyof MessageMap>(
    type: K,
    handler: (
        payload: HandlerPayload<K>,
        sender: Browser.runtime.MessageSender,
    ) => MessageResponse<K> | Promise<MessageResponse<K>>,
) {
    browser.runtime.onMessage.addListener(
        (message: Message, sender, sendResponse) => {
            if (message.type !== type) return false;

            const payload = (
                "data" in message ? message.data : undefined
            ) as HandlerPayload<K>;

            Promise.resolve(handler(payload, sender)).then(sendResponse);

            return true;
        },
    );
}
