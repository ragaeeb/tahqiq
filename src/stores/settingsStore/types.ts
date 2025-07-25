export type SettingsState = SettingsActions & SettingsStateCore;

export type SettingsStateCore = {
    readonly geminiApiKeys: string[];
};

/**
 * Action functions available for settings manipulation
 */
type SettingsActions = {
    updateGeminiApiKeys: (keys: string[]) => void;
};
