import { record } from 'nanolytics';

import SubmittableInput from '@/components/submittable-input';
import { createMatcher } from '@/lib/search';
import type { Excerpt, Heading } from '@/stores/excerptsStore/types';
import { useExcerptsStore } from '@/stores/excerptsStore/useExcerptsStore';

type ExcerptsTableHeaderProps = { activeTab: string; excerpts: Excerpt[]; footnotes: Excerpt[]; headings: Heading[] };

export default function ExcerptsTableHeader({ activeTab, excerpts, footnotes, headings }: ExcerptsTableHeaderProps) {
    const filterExcerptsByIds = useExcerptsStore((state) => state.filterExcerptsByIds);
    const filterHeadingsByIds = useExcerptsStore((state) => state.filterHeadingsByIds);
    const filterFootnotesByIds = useExcerptsStore((state) => state.filterFootnotesByIds);

    if (activeTab === 'excerpts') {
        return (
            <tr>
                <th className="w-32 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        name="from"
                        onSubmit={(query) => {
                            record('FilterExcerptsByPage', query);
                            const pageNum = Number.parseInt(query);
                            if (!Number.isNaN(pageNum)) {
                                filterExcerptsByIds(excerpts.filter((e) => e.from === pageNum).map((e) => e.id));
                            } else {
                                filterExcerptsByIds(undefined);
                            }
                        }}
                        placeholder="Page"
                    />
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        name="nass"
                        dir="auto"
                        onSubmit={(query) => {
                            record('FilterExcerptsByArabic', query);
                            if (query) {
                                const matches = createMatcher(query);
                                filterExcerptsByIds(excerpts.filter((e) => matches(e.nass)).map((e) => e.id));
                            } else {
                                filterExcerptsByIds(undefined);
                            }
                        }}
                        placeholder={`Arabic (${excerpts.length})`}
                    />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-left text-gray-700 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        name="text"
                        onSubmit={(query) => {
                            record('FilterExcerptsByTranslation', query);
                            if (query) {
                                const matches = createMatcher(query);
                                filterExcerptsByIds(excerpts.filter((e) => matches(e.text)).map((e) => e.id));
                            } else {
                                filterExcerptsByIds(undefined);
                            }
                        }}
                        placeholder="Translation"
                    />
                </th>
                <th className="w-16 px-2 py-3 text-center font-semibold text-gray-700 text-sm">Actions</th>
            </tr>
        );
    }

    if (activeTab === 'headings') {
        return (
            <tr>
                <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        name="from"
                        onSubmit={(query) => {
                            record('FilterHeadingsByPage', query);
                            const pageNum = Number.parseInt(query, 10);
                            if (!Number.isNaN(pageNum)) {
                                filterHeadingsByIds(headings.filter((h) => h.from === pageNum).map((h) => h.id));
                            } else {
                                filterHeadingsByIds(undefined);
                            }
                        }}
                        placeholder="From"
                    />
                </th>
                <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">Parent</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        name="nass"
                        onSubmit={(query) => {
                            record('FilterHeadingsByArabic', query);
                            if (query) {
                                const matches = createMatcher(query);
                                filterHeadingsByIds(headings.filter((h) => matches(h.nass)).map((h) => h.id));
                            } else {
                                filterHeadingsByIds(undefined);
                            }
                        }}
                        placeholder={`Arabic (${headings.length})`}
                    />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    <SubmittableInput
                        className="w-full border-none bg-transparent px-1 py-1 text-left text-gray-700 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                        name="text"
                        onSubmit={(query) => {
                            record('FilterHeadingsByTranslation', query);
                            if (query) {
                                const matches = createMatcher(query);
                                filterHeadingsByIds(headings.filter((h) => matches(h.text)).map((h) => h.id));
                            } else {
                                filterHeadingsByIds(undefined);
                            }
                        }}
                        placeholder="Translation"
                    />
                </th>
                <th className="w-16 px-2 py-3 text-center font-semibold text-gray-700 text-sm">Actions</th>
            </tr>
        );
    }

    // Footnotes tab
    return (
        <tr>
            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    name="from"
                    onSubmit={(query) => {
                        record('FilterFootnotesByPage', query);
                        const pageNum = Number.parseInt(query);
                        if (!Number.isNaN(pageNum)) {
                            filterFootnotesByIds(footnotes.filter((f) => f.from === pageNum).map((f) => f.id));
                        } else {
                            filterFootnotesByIds(undefined);
                        }
                    }}
                    placeholder="From"
                />
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-base text-gray-700 leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    name="nass"
                    onSubmit={(query) => {
                        record('FilterFootnotesByArabic', query);
                        if (query) {
                            const matches = createMatcher(query);
                            filterFootnotesByIds(footnotes.filter((f) => matches(f.nass)).map((f) => f.id));
                        } else {
                            filterFootnotesByIds(undefined);
                        }
                    }}
                    placeholder={`Arabic (${footnotes.length})`}
                />
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-left text-gray-600 text-sm leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    name="text"
                    onSubmit={(query) => {
                        record('FilterFootnotesByTranslation', query);
                        if (query) {
                            const matches = createMatcher(query);
                            filterFootnotesByIds(footnotes.filter((f) => matches(f.text)).map((f) => f.id));
                        } else {
                            filterFootnotesByIds(undefined);
                        }
                    }}
                    placeholder="Translation"
                />
            </th>
            <th className="w-16 px-2 py-3 text-center font-semibold text-gray-700 text-sm">Actions</th>
        </tr>
    );
}
