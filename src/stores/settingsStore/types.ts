export type SettingsState = SettingsActions & SettingsStateCore;

export type SettingsStateCore = {
    readonly geminiApiKeys: string[];
    readonly quickSubs: string[];
    readonly shamelaApiKey: string;
    readonly shamelaBookEndpoint: string;
};

/**
 * Action functions available for settings manipulation
 */
type SettingsActions = {
    /** Hydrate settings from localStorage (call on client mount) */
    hydrate: () => void;
    updateGeminiApiKeys: (keys: string[]) => void;
    updateQuickSubs: (values: string[]) => void;
    updateShamelaApiKey: (key: string) => void;
    updateShamelaBookEndpoint: (endpoint: string) => void;
};
