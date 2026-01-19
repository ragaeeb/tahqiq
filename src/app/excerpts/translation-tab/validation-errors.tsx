'use client';

import { EyeIcon, FileWarningIcon } from 'lucide-react';
import { useMemo } from 'react';
import type { ValidationError } from 'wobble-bibble';

import { Button } from '@/components/ui/button';
import { DialogTriggerButton } from '@/components/ui/dialog-trigger';
import type { TranslationModel } from '@/lib/constants';

import { formatValidationErrors } from '@/lib/segmentation';
import { ValidationReportDialog } from './validation-report-dialog';

interface ValidationErrorsProps {
    errors: ValidationError[];
    onInspect: (e: React.MouseEvent, id: string, range: { start: number; end: number }) => void;
    selectedModel: TranslationModel;
    textValue: string;
}

export function ValidationErrors({ errors, onInspect, selectedModel, textValue }: ValidationErrorsProps) {
    const formattedErrors = useMemo(() => formatValidationErrors(errors), [errors]);

    const groupedErrors = useMemo(() => {
        type GroupedError = { message: string; items: { id: string; range: { start: number; end: number } }[] };
        const groups = new Map<string, GroupedError>();
        for (const err of errors) {
            const cleanMessage = err.message.replace(/ in "[^"]+"/, '').trim();
            const key = cleanMessage;
            const existing = groups.get(key) || { items: [], message: cleanMessage };

            const id = err.id || '?';
            if (!existing.items.some((item) => item.id === id)) {
                existing.items.push({ id, range: err.range });
            }
            groups.set(key, existing);
        }
        return Array.from(groups.values());
    }, [errors]);

    if (errors.length === 0) {
        return null;
    }

    return (
        <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700 text-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 flex-col gap-0">
                    {groupedErrors.map((group, i) => (
                        <div key={i.toString()} className="flex items-center gap-1 py-0">
                            <span className="shrink-0 select-none text-red-500 text-xs">⚠</span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0">
                                <div className="inline-flex items-center gap-0.5">
                                    {group.items.map((item, j) => (
                                        <Button
                                            key={`${item.id}-${j.toString()}`}
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 gap-1 rounded-sm px-1 font-mono text-[10px] text-red-700 hover:bg-red-200 hover:text-red-900"
                                            onClick={(e) => onInspect(e, item.id, item.range)}
                                            title={`View ${item.id}`}
                                        >
                                            <EyeIcon className="h-2.5 w-2.5 opacity-60" />
                                            <span className="font-bold">{item.id}</span>
                                        </Button>
                                    ))}
                                </div>
                                <span className="text-red-800 text-xs leading-none">{group.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogTriggerButton
                    className="shrink-0"
                    renderContent={(close) => {
                        const modelName = (selectedModel.label || 'unknown').replace(/\s+/g, '_');
                        const firstId = errors[0]?.id || 'unknown';
                        return (
                            <ValidationReportDialog
                                defaultErrors={formattedErrors || ''}
                                defaultFileName={`${modelName}_${firstId}`}
                                defaultModel={selectedModel.value}
                                defaultResponse={textValue}
                                onClose={close}
                            />
                        );
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    <FileWarningIcon className="mr-1 h-3 w-3" />
                    Create Report
                </DialogTriggerButton>
            </div>
        </div>
    );
}
