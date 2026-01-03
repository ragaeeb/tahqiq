'use client';

import { record } from 'nanolytics';
import React from 'react';
import SubmittableInput from '@/components/submittable-input';
import type { WebPage, WebTitle } from '@/stores/webStore/types';
import type { FilterField } from './use-web-filters';

type TableHeaderProps = {
    activeTab: 'pages' | 'titles';
    filters: { content: string; id: string };
    onFilterChange: (field: FilterField, value: string) => void;
    pages: WebPage[];
    titles: WebTitle[];
};

function PagesTableHeader({
    filters,
    onFilterChange,
    pages,
}: Pick<TableHeaderProps, 'filters' | 'onFilterChange' | 'pages'>) {
    return (
        <tr>
            <th className="w-24 px-2 py-3 text-center font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.id}
                    name="id"
                    onSubmit={(query) => {
                        record('FilterWebById', query);
                        onFilterChange('id', query);
                    }}
                    placeholder="ID"
                />
            </th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.content}
                    dir="auto"
                    name="content"
                    onSubmit={(query) => {
                        record('FilterWebByContent', query);
                        onFilterChange('content', query);
                    }}
                    placeholder={`المحتوى (${pages.length})`}
                />
            </th>
        </tr>
    );
}

function TitlesTableHeader({
    filters,
    onFilterChange,
    titles,
}: Pick<TableHeaderProps, 'filters' | 'onFilterChange' | 'titles'>) {
    return (
        <tr>
            <th className="w-24 px-2 py-3 text-center align-middle font-semibold text-gray-700 text-sm">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-center text-gray-800 text-xs leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.id}
                    name="id"
                    onSubmit={(query) => {
                        record('FilterWebTitlesById', query);
                        onFilterChange('id', query);
                    }}
                    placeholder="ID"
                />
            </th>
            <th className="px-4 py-3 text-right align-middle font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.content}
                    dir="auto"
                    name="content"
                    onSubmit={(query) => {
                        record('FilterWebTitlesByContent', query);
                        onFilterChange('content', query);
                    }}
                    placeholder={`العنوان (${titles.length})`}
                />
            </th>
        </tr>
    );
}

function WebTableHeader({ activeTab, filters, onFilterChange, pages, titles }: TableHeaderProps) {
    return activeTab === 'pages' ? (
        <PagesTableHeader filters={filters} onFilterChange={onFilterChange} pages={pages} />
    ) : (
        <TitlesTableHeader filters={filters} onFilterChange={onFilterChange} titles={titles} />
    );
}

export default React.memo(WebTableHeader);
