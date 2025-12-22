'use client';

import type { CommonLineStartPattern } from 'flappa-doormal';
import { PlusIcon, XIcon } from 'lucide-react';

export type PatternChipProps = {
    colorScheme: 'blue' | 'red' | 'amber';
    mode?: 'add' | 'remove';
    onAction: () => void;
    pattern: CommonLineStartPattern;
    showCount?: boolean;
    tooltipBuilder?: (pattern: CommonLineStartPattern) => string;
};

const defaultTooltipBuilder = (pattern: CommonLineStartPattern): string => {
    const lines = [`Count: ${pattern.count}`];
    const examples = pattern.examples?.slice(0, 3) ?? [];
    for (const ex of examples) {
        lines.push(`• ${ex.line.slice(0, 50)}${ex.line.length > 50 ? '...' : ''}`);
    }
    return lines.join('\n');
};

/**
 * Reusable pattern chip with click-to-navigate and action button (add/remove)
 */
export const PatternChip = ({
    colorScheme,
    mode = 'remove',
    onAction,
    pattern,
    showCount = true,
    tooltipBuilder = defaultTooltipBuilder,
}: PatternChipProps) => {
    const colors = {
        amber: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        blue: 'bg-blue-200 text-blue-800 hover:bg-blue-300',
        red: 'bg-red-100 text-red-800 hover:bg-red-200',
    };
    const actionColors = {
        add: {
            amber: 'text-green-600 hover:text-green-800 hover:bg-amber-200',
            blue: 'text-green-600 hover:text-green-800 hover:bg-blue-300',
            red: 'text-green-600 hover:text-green-800 hover:bg-red-200',
        },
        remove: {
            amber: 'text-amber-600 hover:text-red-600 hover:bg-amber-200',
            blue: 'text-blue-600 hover:text-red-600 hover:bg-blue-300',
            red: 'text-red-600 hover:text-red-800 hover:bg-red-200',
        },
    };

    const example = pattern.examples?.[0];

    return (
        <span className={`inline-flex items-center gap-0.5 rounded font-mono text-xs ${colors[colorScheme]}`}>
            <button
                className="cursor-pointer px-1.5 py-0.5"
                onClick={() => {
                    if (example?.pageId) {
                        window.location.hash = `#${example.pageId}`;
                    }
                }}
                title={tooltipBuilder(pattern)}
                type="button"
            >
                {pattern.pattern}
                {showCount && ` (${pattern.count})`}
            </button>
            <button
                className={`rounded-r px-0.5 py-0.5 ${actionColors[mode][colorScheme]}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onAction();
                }}
                title={mode === 'add' ? 'Add to selection' : 'Remove'}
                type="button"
            >
                {mode === 'add' ? <PlusIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
            </button>
        </span>
    );
};
