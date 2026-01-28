'use client';

import { record } from 'nanolytics';
import { useEffect } from 'react';

import { ClickToReveal } from '@/components/click-to-reveal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import '@/lib/analytics';
import VersionFooter from '@/components/version-footer';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

/**
 * Settings page for managing application configuration.
 *
 * Allows users to configure and manage their Gemini API keys, Shamela settings, and HuggingFace dataset uploads.
 * API keys are stored in browser localStorage with base64 encoding.
 */
export default function Settings() {
    const hydrate = useSettingsStore((state) => state.hydrate);
    const geminiApiKeys = useSettingsStore((state) => state.geminiApiKeys);
    const updateGeminiApiKeys = useSettingsStore((state) => state.updateGeminiApiKeys);
    const quickSubs = useSettingsStore((state) => state.quickSubs);
    const updateQuickSubs = useSettingsStore((state) => state.updateQuickSubs);
    const shamelaApiKey = useSettingsStore((state) => state.shamelaApiKey);
    const updateShamelaApiKey = useSettingsStore((state) => state.updateShamelaApiKey);
    const shamelaBookEndpoint = useSettingsStore((state) => state.shamelaBookEndpoint);
    const updateShamelaBookEndpoint = useSettingsStore((state) => state.updateShamelaBookEndpoint);
    const huggingfaceToken = useSettingsStore((state) => state.huggingfaceToken);
    const updateHuggingfaceToken = useSettingsStore((state) => state.updateHuggingfaceToken);
    const huggingfaceExcerptDataset = useSettingsStore((state) => state.huggingfaceExcerptDataset);
    const updateHuggingfaceDataset = useSettingsStore((state) => state.updateHuggingfaceExcerptDataset);

    // Hydrate settings from localStorage on client mount
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return (
        <>
            <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)] sm:p-12">
                <div className="mx-auto max-w-2xl space-y-8">
                    <div>
                        <h1 className="font-bold text-2xl text-gray-900">Settings</h1>
                        <p className="mt-1 text-gray-500 text-sm">
                            Configure your API keys and application preferences
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gemini API Keys</CardTitle>
                            <CardDescription>
                                API keys for AI-powered translation features. One key per line.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ClickToReveal
                                defaultValue={geminiApiKeys.join('\n')}
                                onSubmit={(value) => updateGeminiApiKeys(value.split('\n').filter(Boolean))}
                                placeholder="Enter your Gemini API keys (one per line)"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shamela Configuration</CardTitle>
                            <CardDescription>
                                Configure your Shamela API access for downloading books directly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="shamela-api-key">API Key</Label>
                                <ClickToReveal
                                    defaultValue={shamelaApiKey}
                                    onSubmit={updateShamelaApiKey}
                                    placeholder="Enter your Shamela API key"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shamela-endpoint">Books Endpoint</Label>
                                <Input
                                    defaultValue={shamelaBookEndpoint}
                                    id="shamela-endpoint"
                                    onBlur={(e) => updateShamelaBookEndpoint(e.target.value)}
                                    placeholder="Custom books endpoint URL (optional)"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>HuggingFace Dataset</CardTitle>
                            <CardDescription>
                                Configure HuggingFace access for uploading compressed excerpt data to your dataset
                                repository.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="hf-token">Access Token</Label>
                                <ClickToReveal
                                    defaultValue={huggingfaceToken}
                                    onSubmit={updateHuggingfaceToken}
                                    placeholder="Enter your HuggingFace access token"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hf-dataset">Dataset URL</Label>
                                <Input
                                    defaultValue={huggingfaceExcerptDataset}
                                    id="hf-dataset"
                                    onBlur={(e) => updateHuggingfaceDataset(e.target.value)}
                                    placeholder="username/dataset-name (for https://huggingface.co/datasets/username/dataset-name)"
                                />
                                <p className="text-gray-500 text-xs">
                                    The dataset of your HuggingFace repository where excerpts will be uploaded.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Substitutions</CardTitle>
                            <CardDescription>
                                Common text substitutions for the manuscript editor. Press Enter to add.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TagInput
                                dir="rtl"
                                onChange={(value) => {
                                    record('QuickSubs', value.toString());
                                    updateQuickSubs(value);
                                }}
                                value={quickSubs}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
