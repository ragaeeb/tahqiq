export type SettingsState = SettingsActions & SettingsStateCore;

export type SettingsStateCore = {
    readonly shamelaDataset: string;
    readonly huggingfaceToken: string;
    readonly excerptsDataset: string;
    readonly aslDataset: string;
};

/**
 * Action functions available for settings manipulation
 */
type SettingsActions = {
    /** Hydrate settings from localStorage (call on client mount) */
    hydrate: () => void;
    updateHuggingfaceToken: (token: string) => void;
    updateExcerptsDataset: (value: string) => void;
    updateShamelaDataset: (endpoint: string) => void;
    updateAslDataset: (endpoint: string) => void;
};
