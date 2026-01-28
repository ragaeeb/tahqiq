import { EyeIcon, WrenchIcon } from 'lucide-react';
import { useMemo } from 'react';
import type { Range, ValidationError, ValidationErrorType } from 'wobble-bibble';

import { Button } from '@/components/ui/button';
import type { TranslationModel } from '@/lib/constants';
import { groupErrorMessages } from '@/lib/errorUtils';

interface ValidationErrorsProps {
    errors: ValidationError[];
    onFix?: (type: ValidationErrorType) => void;
    onInspect: (e: React.MouseEvent, id: string, range: Range) => void;
    selectedModel: TranslationModel;
    textValue: string;
}

export function ValidationErrors({ errors, onFix, onInspect }: ValidationErrorsProps) {
    const groupedErrors = useMemo(() => {
        return groupErrorMessages(errors);
    }, [errors]);

    if (groupedErrors.length === 0) {
        return null;
    }

    return (
        <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-red-700 text-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="flex max-h-40 min-w-0 flex-1 flex-col gap-0 overflow-y-auto pr-2">
                    {groupedErrors.map((group, i) => {
                        const isAlreadyTranslated = group.message === 'IDs have already been translated';
                        const icon = isAlreadyTranslated ? 'ℹ' : '⚠';
                        const textColor = isAlreadyTranslated ? 'text-amber-500' : 'text-red-500';
                        const messageColor = isAlreadyTranslated ? 'text-amber-800' : 'text-red-800';
                        // Button colors
                        const btnText = isAlreadyTranslated ? 'text-amber-700' : 'text-red-700';
                        const btnHover = isAlreadyTranslated
                            ? 'hover:bg-amber-100 hover:text-amber-900'
                            : 'hover:bg-red-200 hover:text-red-900';

                        return (
                            <div key={i.toString()} className="flex items-start gap-1 py-0.5">
                                <span className={`shrink-0 select-none pt-0.5 ${textColor} text-xs`}>{icon}</span>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <div className="flex flex-wrap items-center gap-0.5">
                                        {group.items.map((item, j) => (
                                            <Button
                                                key={`${item.id}-${j.toString()}`}
                                                variant="ghost"
                                                size="sm"
                                                className={`h-5 gap-1 rounded-sm px-1 font-mono text-[10px] ${btnText} ${btnHover}`}
                                                onClick={(e) => onInspect(e, item.id, item.range)}
                                                title={`View ${item.id}`}
                                            >
                                                <EyeIcon className="h-2.5 w-2.5 opacity-60" />
                                                <span className="font-bold">{item.id}</span>
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`${messageColor} text-xs leading-none`}>{group.message}</span>
                                        {onFix && group.type && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-4 w-4 rounded-full p-0 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onFix(group.type!);
                                                }}
                                                title={`Auto-fix ${group.type} errors`}
                                            >
                                                <WrenchIcon className="h-2.5 w-2.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
