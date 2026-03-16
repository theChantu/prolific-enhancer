import type { Settings, SettingsUpdate } from "@/store/createStore";

type StoreUpdateMessage = SettingsUpdate & {
    siteName: string;
};

type StoreFetchMessage = {
    url: string;
    settings: (keyof Settings)[];
};

interface MessageMap {
    "store-fetch": StoreFetchMessage;
    "survey-notification": {
        title: string;
        message: string;
        iconUrl?: string;
        surveyLink: string;
    };
    "store-update": StoreUpdateMessage;
    "store-changed": SettingsUpdate;
}

interface ResponseMap {
    "store-fetch": { siteName: string; data: Settings } | null;
    "survey-notification": void;
    "store-update": void;
    "store-changed": void;
}

type MessageResponse<K extends keyof MessageMap> = K extends keyof ResponseMap
    ? ResponseMap[K]
    : void;

type HandlerPayload<K extends keyof MessageMap> =
    MessageMap[K] extends undefined ? undefined : MessageMap[K];

type Message<K extends keyof MessageMap = keyof MessageMap> =
    K extends keyof MessageMap
        ? MessageMap[K] extends undefined
            ? { type: K }
            : { type: K; data: MessageMap[K] }
        : never;

export { MessageMap, MessageResponse, HandlerPayload, Message };
