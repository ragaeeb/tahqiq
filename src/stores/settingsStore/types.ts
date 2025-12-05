export type SettingsState = SettingsActions & SettingsStateCore;

export type SettingsStateCore = { readonly geminiApiKeys: string[]; readonly quickSubs: string[] };

/**
 * Action functions available for settings manipulation
 */
type SettingsActions = { updateGeminiApiKeys: (keys: string[]) => void; updateQuickSubs: (values: string[]) => void };
