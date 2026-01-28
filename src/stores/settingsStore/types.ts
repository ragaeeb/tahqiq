export type SettingsState = SettingsActions & SettingsStateCore;

export type SettingsStateCore = {
    readonly quickSubs: string[];
    readonly shamelaDataset: string;
    readonly huggingfaceToken: string;
    readonly huggingfaceExcerptDataset: string;
};

/**
 * Action functions available for settings manipulation
 */
type SettingsActions = {
    /** Hydrate settings from localStorage (call on client mount) */
    hydrate: () => void;
    updateHuggingfaceToken: (token: string) => void;
    updateHuggingfaceExcerptDataset: (value: string) => void;
    updateQuickSubs: (values: string[]) => void;
    updateShamelaDataset: (endpoint: string) => void;
};
