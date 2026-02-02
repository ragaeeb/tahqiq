'use client';

import { ArrowDownWideNarrowIcon, ReplaceIcon } from 'lucide-react';
import { record } from 'nanolytics';

import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import type { Excerpt, Heading } from '@/stores/excerptsStore/types';
import { SearchReplaceDialogContent } from './search-replace-dialog';
import type { FilterField, SortMode } from './use-excerpt-filters';

type ExcerptsTableHeaderProps = {
    activeTab: string;
    excerpts: Excerpt[];
    filters: { ids?: string[]; nass: string; page: string; text: string };
    footnotes: Excerpt[];
    headings: Heading[];
    /** Hide the translation column (only for excerpts tab) */
    hideTranslation?: boolean;
    onFilterChange: (field: FilterField, value: string) => void;
    /** Current sort mode */
    sortMode?: SortMode;
    /** Callback to change sort mode */
    onSortChange?: (mode: SortMode) => void;
};

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
                const selectedText = window.getSelection()?.toString().trim() || '';
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
    onSortChange,
    sortMode = 'default',
}: ExcerptsTableHeaderProps) {
    const handleSortToggle = () => {
        if (onSortChange) {
            const newMode = sortMode === 'length' ? 'default' : 'length';
            record('SortExcerpts', newMode);
            onSortChange(newMode);
        }
    };

    if (activeTab === 'excerpts') {
        return (
            <tr>
                <th className="w-8 px-1 py-1" />
                <th className="w-24 px-1 py-1 text-center font-semibold text-gray-700 text-sm">
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
                <th className="px-2 py-1 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                    <div className="flex items-center gap-2">
                        <Button
                            className={sortMode === 'length' ? 'bg-blue-500' : ''}
                            onClick={handleSortToggle}
                            size="sm"
                            title={sortMode === 'length' ? 'Reset sort order' : 'Sort by length (longest first)'}
                            variant="ghost"
                        >
                            <ArrowDownWideNarrowIcon className="h-4 w-4" />
                        </Button>
                        <SubmittableInput
                            trim={false}
                            className="w-full border-none bg-transparent px-0 py-1 text-right font-arabic text-gray-800 text-lg leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                            defaultValue={filters.nass}
                            dir="auto"
                            name="nass"
                            onSubmit={(query) => {
                                record('FilterExcerptsByArabic', query);
                                onFilterChange('nass', query);
                            }}
                            placeholder={`Arabic (${excerpts.length})`}
                        />
                    </div>
                </th>
                {!hideTranslation && (
                    <th className="px-2 py-1 text-left font-semibold text-gray-700 text-sm">
                        <SubmittableInput
                            className="w-full border-none bg-transparent px-0 py-1 text-left text-gray-700 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
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
                <th className="w-28 px-1 py-1 text-center font-semibold text-gray-700 text-sm">
                    <div className="flex items-center justify-center gap-1">
                        <SearchReplaceButton activeTab={activeTab} />
                    </div>
                </th>
            </tr>
        );
    }

    if (activeTab === 'headings') {
        return (
            <tr>
                <th className="w-20 px-1 py-1 text-center font-semibold text-gray-700 text-sm">ID</th>
                <th className="w-24 px-1 py-1 text-center font-semibold text-gray-700 text-sm">
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
                <th className="px-2 py-1 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-0 py-1 text-right font-arabic text-gray-800 text-lg leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.nass}
                        name="nass"
                        onSubmit={(query) => {
                            record('FilterHeadingsByArabic', query);
                            onFilterChange('nass', query);
                        }}
                        placeholder={`Arabic (${headings.length})`}
                    />
                </th>
                <th className="px-2 py-1 text-left font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-0 py-1 text-left text-gray-700 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        defaultValue={filters.text}
                        name="text"
                        onSubmit={(query) => {
                            record('FilterHeadingsByTranslation', query);
                            onFilterChange('text', query);
                        }}
                        placeholder="Translation"
                    />
                </th>
                <th className="w-16 px-1 py-1 text-center font-semibold text-gray-700 text-sm">
                    <div className="flex items-center justify-center gap-1">
                        <SearchReplaceButton activeTab={activeTab} />
                    </div>
                </th>
            </tr>
        );
    }

    // Footnotes tab
    return (
        <tr>
            <th className="w-24 px-1 py-1 text-center font-semibold text-gray-700 text-sm">
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
            <th className="px-2 py-1 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-0 py-1 text-right font-arabic text-base text-gray-700 leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.nass}
                    name="nass"
                    onSubmit={(query) => {
                        record('FilterFootnotesByArabic', query);
                        onFilterChange('nass', query);
                    }}
                    placeholder={`Arabic (${footnotes.length})`}
                />
            </th>
            <th className="px-2 py-1 text-left font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-0 py-1 text-left text-gray-600 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.text}
                    name="text"
                    onSubmit={(query) => {
                        record('FilterFootnotesByTranslation', query);
                        onFilterChange('text', query);
                    }}
                    placeholder="Translation"
                />
            </th>
            <th className="w-16 px-1 py-1 text-center font-semibold text-gray-700 text-sm">
                <div className="flex items-center justify-center gap-1">
                    <SearchReplaceButton activeTab={activeTab} />
                </div>
            </th>
        </tr>
    );
}
