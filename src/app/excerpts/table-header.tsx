'use client';

import { ReplaceIcon } from 'lucide-react';
import { record } from 'nanolytics';

import SubmittableInput from '@/components/submittable-input';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import type { Excerpt, Heading } from '@/stores/excerptsStore/types';

import { SearchReplaceDialogContent } from './search-replace-dialog';
import type { FilterField } from './use-excerpt-filters';

type ExcerptsTableHeaderProps = {
    activeTab: string;
    excerpts: Excerpt[];
    filters: { nass: string; page: string; text: string };
    footnotes: Excerpt[];
    headings: Heading[];
    /** Hide the translation column (only for excerpts tab) */
    hideTranslation?: boolean;
    onFilterChange: (field: FilterField, value: string) => void;
};

/**
 * Gets the currently selected text from the window
 */
function getSelectedText(): string {
    return window.getSelection()?.toString().trim() || '';
}

/**
 * Search/Replace button that captures selected text when opened
 */
function SearchReplaceButton({ activeTab }: { activeTab: string }) {
    return (
        <DialogTriggerButton
            onClick={() => {
                record('OpenSearchReplace');
            }}
            renderContent={() => {
                const selectedText = getSelectedText();
                return <SearchReplaceDialogContent activeTab={activeTab} initialSearchPattern={selectedText} />;
            }}
            size="sm"
            title="Search and Replace"
            variant="outline"
        >
            <ReplaceIcon className="h-4 w-4" />
        </DialogTriggerButton>
    );
}

export default function ExcerptsTableHeader({
    activeTab,
    excerpts,
    filters,
    footnotes,
    headings,
    hideTranslation,
    onFilterChange,
}: ExcerptsTableHeaderProps) {
    if (activeTab === 'excerpts') {
        return (
            <tr>
                <th className="w-32 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.page}
                        name="from"
                        onSubmit={(query) => {
                            record('FilterExcerptsByPage', query);
                            onFilterChange('page', query);
                        }}
                        placeholder="Page"
                    />
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.nass}
                        dir="auto"
                        name="nass"
                        onSubmit={(query) => {
                            record('FilterExcerptsByArabic', query);
                            onFilterChange('nass', query);
                        }}
                        placeholder={`Arabic (${excerpts.length})`}
                    />
                </th>
                {!hideTranslation && (
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                        <SubmittableInput
                            className="w-full border-none bg-transparent px-1 py-1 text-left text-gray-700 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                            defaultValue={filters.text}
                            name="text"
                            onSubmit={(query) => {
                                record('FilterExcerptsByTranslation', query);
                                onFilterChange('text', query);
                            }}
                            placeholder="Translation"
                        />
                    </th>
                )}
                <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                    <SearchReplaceButton activeTab={activeTab} />
                </th>
            </tr>
        );
    }

    if (activeTab === 'headings') {
        return (
            <tr>
                <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.page}
                        name="from"
                        onSubmit={(query) => {
                            record('FilterHeadingsByPage', query);
                            onFilterChange('page', query);
                        }}
                        placeholder="From"
                    />
                </th>
                <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">Parent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.nass}
                        name="nass"
                        onSubmit={(query) => {
                            record('FilterHeadingsByArabic', query);
                            onFilterChange('nass', query);
                        }}
                        placeholder={`Arabic (${headings.length})`}
                    />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-left text-gray-700 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.text}
                        name="text"
                        onSubmit={(query) => {
                            record('FilterHeadingsByTranslation', query);
                            onFilterChange('text', query);
                        }}
                        placeholder="Translation"
                    />
                </th>
                <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                    <SearchReplaceButton activeTab={activeTab} />
                </th>
            </tr>
        );
    }

    // Footnotes tab
    return (
        <tr>
            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.page}
                    name="from"
                    onSubmit={(query) => {
                        record('FilterFootnotesByPage', query);
                        onFilterChange('page', query);
                    }}
                    placeholder="From"
                />
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-base text-gray-700 leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.nass}
                    name="nass"
                    onSubmit={(query) => {
                        record('FilterFootnotesByArabic', query);
                        onFilterChange('nass', query);
                    }}
                    placeholder={`Arabic (${footnotes.length})`}
                />
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-left text-gray-600 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.text}
                    name="text"
                    onSubmit={(query) => {
                        record('FilterFootnotesByTranslation', query);
                        onFilterChange('text', query);
                    }}
                    placeholder="Translation"
                />
            </th>
            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                <SearchReplaceButton activeTab={activeTab} />
            </th>
        </tr>
    );
}
