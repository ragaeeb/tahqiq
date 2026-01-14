'use client';

import { LanguagesIcon, PlusIcon } from 'lucide-react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddTranslationTab } from './add-translation-tab';
import { PickerTab } from './picker-tab';

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
    return (
        <DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <LanguagesIcon className="h-5 w-5" />
                    Translation Workflow
                </DialogTitle>
                <DialogDescription>
                    Pick excerpts to send to an LLM, then paste the translations back to apply them.
                </DialogDescription>
            </DialogHeader>

            <Tabs className="flex flex-1 flex-col overflow-hidden" defaultValue={defaultTab}>
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
                    <PickerTab />
                </TabsContent>

                <TabsContent value="add" className="flex flex-1 flex-col overflow-hidden">
                    <AddTranslationTab />
                </TabsContent>
            </Tabs>
        </DialogContent>
    );
}
