export type SettingsState = SettingsActions & SettingsStateCore;

export type SettingsStateCore = {
    readonly geminiApiKeys: string[];
    readonly quickSubs: string[];
    readonly shamelaApiKey: string;
    readonly shamelaBookEndpoint: string;
    readonly huggingfaceToken: string;
    readonly huggingfaceExcerptDataset: string;
};

/**
 * Action functions available for settings manipulation
 */
type SettingsActions = {
    /** Hydrate settings from localStorage (call on client mount) */
    hydrate: () => void;
    updateGeminiApiKeys: (keys: string[]) => void;
    updateHuggingfaceToken: (token: string) => void;
    updateHuggingfaceExcerptDataset: (value: string) => void;
    updateQuickSubs: (values: string[]) => void;
    updateShamelaApiKey: (key: string) => void;
    updateShamelaBookEndpoint: (endpoint: string) => void;
};
