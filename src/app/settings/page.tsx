'use client';

import { ClickToReveal } from '@/components/click-to-reveal';
import VersionFooter from '@/components/version-footer';
import '@/lib/analytics';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

/**
 * Displays and manages transcript segments with selection and file import capabilities.
 *
 * Renders a transcript viewer that allows users to import transcript files, select transcript parts, and interact with individual segments. If no transcript is loaded, prompts the user to * upload a JSON transcript file.
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
