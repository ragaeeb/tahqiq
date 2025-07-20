'use client';

import { ClickToReveal } from '@/components/click-to-reveal';
import VersionFooter from '@/components/version-footer';
import '@/lib/analytics';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

/**
 * Settings page for managing application configuration.
 *
 * Allows users to configure and manage their Gemini API keys through a secure input interface.
 * API keys are stored in browser localStorage with base64 encoding.
 */
export default function Settings() {
    const geminiApiKeys = useSettingsStore((state) => state.geminiApiKeys);
    const updateGeminiApiKeys = useSettingsStore((state) => state.updateGeminiApiKeys);

    return (
        <>
            <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <div className="flex flex-col w-full max-w">
                    <ClickToReveal
                        defaultValue={geminiApiKeys.join('\n')}
                        onSubmit={(value) => updateGeminiApiKeys(value.split('\n'))}
                        placeholder="Enter your Gemini API keys"
                    />
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
