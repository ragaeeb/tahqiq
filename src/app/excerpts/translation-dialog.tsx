'use client';

import { LanguagesIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TRANSLATION_MODELS } from '@/lib/constants';
import { AddTranslationTab } from './translation-tab/add-translation-tab';
import { PickerTab } from './translation-tab/picker-tab';
import { getSavedModel, TranslatorSelect } from './translation-tab/translator-select';

type TranslationDialogContentProps = {
    /** Which tab to show initially. Defaults to 'pick'. */
    defaultTab?: 'pick' | 'add';
};

/**
 * Unified translation dialog with tabs for:
 * 1. "Pick Excerpts" - Select untranslated excerpts and copy to clipboard for LLM translation
 * 2. "Add Translations" - Paste translations received from LLM and apply them to excerpts
 *
 * This consolidates the workflow so users don't need to switch between dialogs.
 */
export function TranslationDialogContent({ defaultTab = 'pick' }: TranslationDialogContentProps) {
    const [selectedModelId, setSelectedModelId] = useState<string>(getSavedModel());

    // Compute the full model object to pass down
    const selectedModel = TRANSLATION_MODELS.find((m) => m.value === selectedModelId) || TRANSLATION_MODELS[0];

    return (
        <DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
            <DialogHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <DialogTitle className="flex items-center gap-2">
                            <LanguagesIcon className="h-5 w-5" />
                            Translation Workflow
                        </DialogTitle>
                        <DialogDescription>
                            Pick excerpts to send to an LLM, then paste the translations back to apply them.
                        </DialogDescription>
                    </div>
                    <TranslatorSelect onChange={setSelectedModelId} value={selectedModelId} persist />
                </div>
            </DialogHeader>

            <Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue={defaultTab}>
                {/* ... TabsList ... */}
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pick" className="flex items-center gap-2">
                        <LanguagesIcon className="h-4 w-4" />
                        Pick Excerpts
                    </TabsTrigger>
                    <TabsTrigger value="add" className="flex items-center gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Add Translations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pick" className="flex flex-1 flex-col overflow-hidden">
                    <PickerTab model={selectedModel} />
                </TabsContent>

                <TabsContent value="add" className="flex flex-1 flex-col overflow-hidden">
                    <AddTranslationTab model={selectedModel} />
                </TabsContent>
            </Tabs>
        </DialogContent>
    );
}
