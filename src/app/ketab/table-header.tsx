'use client';

import { record } from 'nanolytics';
import React from 'react';
import SubmittableInput from '@/components/submittable-input';
import type { KetabPage, KetabTitle } from '@/stores/ketabStore/types';
import type { FilterField } from './use-ketab-filters';

type TableHeaderProps = {
    activeTab: 'pages' | 'titles';
    filters: { body: string; page: string; title: string };
    onFilterChange: (field: FilterField, value: string) => void;
    pages: KetabPage[];
    titles: KetabTitle[];
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
                    defaultValue={filters.page}
                    name="page"
                    onSubmit={(query) => {
                        record('FilterKetabByPage', query);
                        onFilterChange('page', query);
                    }}
                    placeholder="Page"
                />
            </th>
            <th className="w-32 px-2 py-3 text-center font-semibold text-gray-700 text-sm">Part</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.body}
                    dir="auto"
                    name="body"
                    onSubmit={(query) => {
                        record('FilterKetabByBody', query);
                        onFilterChange('body', query);
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
                    defaultValue={filters.page}
                    name="page"
                    onSubmit={(query) => {
                        record('FilterKetabTitlesByPage', query);
                        onFilterChange('page', query);
                    }}
                    placeholder="Page"
                />
            </th>
            <th className="w-24 px-2 py-3 text-center align-middle font-semibold text-gray-700 text-sm">Level</th>
            <th className="px-4 py-3 text-right align-middle font-semibold text-gray-700 text-sm" dir="rtl">
                <SubmittableInput
                    className="w-full border-none bg-transparent px-1 py-1 text-right font-arabic text-gray-800 text-xl leading-relaxed outline-none transition-colors duration-150 focus:rounded focus:bg-gray-50"
                    defaultValue={filters.title}
                    dir="auto"
                    name="title"
                    onSubmit={(query) => {
                        record('FilterKetabTitlesByContent', query);
                        onFilterChange('title', query);
                    }}
                    placeholder={`العنوان (${titles.length})`}
                />
            </th>
        </tr>
    );
}

function KetabTableHeader({ activeTab, filters, onFilterChange, pages, titles }: TableHeaderProps) {
    return activeTab === 'pages' ? (
        <PagesTableHeader filters={filters} onFilterChange={onFilterChange} pages={pages} />
    ) : (
        <TitlesTableHeader filters={filters} onFilterChange={onFilterChange} titles={titles} />
    );
}

export default React.memo(KetabTableHeader);
