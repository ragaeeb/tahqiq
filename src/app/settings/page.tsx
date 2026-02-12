'use client';

import { useEffect } from 'react';

import { ClickToReveal } from '@/components/click-to-reveal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    const shamelaDataset = useSettingsStore((state) => state.shamelaDataset);
    const updateShamelaDataset = useSettingsStore((state) => state.updateShamelaDataset);
    const huggingfaceToken = useSettingsStore((state) => state.huggingfaceToken);
    const updateHuggingfaceToken = useSettingsStore((state) => state.updateHuggingfaceToken);
    const huggingfaceExcerptDataset = useSettingsStore((state) => state.excerptsDataset);
    const updateHuggingfaceDataset = useSettingsStore((state) => state.updateExcerptsDataset);
    const aslDataset = useSettingsStore((state) => state.aslDataset);
    const updateAslDataset = useSettingsStore((state) => state.updateAslDataset);

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
                                <Label htmlFor="hf-dataset">Excerpts Dataset</Label>
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

                            <div className="space-y-2">
                                <Label htmlFor="shamela-endpoint">Shamela Dataset</Label>
                                <Input
                                    defaultValue={shamelaDataset}
                                    id="shamela-endpoint"
                                    onBlur={(e) => updateShamelaDataset(e.target.value)}
                                    placeholder="username/dataset-name (for https://huggingface.co/datasets/username/dataset-name)"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="asl-dataset">ASL Dataset</Label>
                                <Input
                                    defaultValue={aslDataset}
                                    id="asl-dataset"
                                    onBlur={(e) => updateAslDataset(e.target.value)}
                                    placeholder="username/dataset-name (for https://huggingface.co/datasets/username/dataset-name)"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
