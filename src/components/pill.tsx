import { memo } from 'react';

type PillProps = {
    /** Optional background color (HSL string) for page-based coloring */
    backgroundColor?: string;
    id: string;
    isSelected: boolean;
    onClick: () => void;
};

const PillInternal = ({ id, isSelected, onClick, backgroundColor }: PillProps) => {
    if (isSelected) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="rounded-full bg-blue-500 px-3 py-1 text-sm text-white transition-colors"
            >
                {id}
            </button>
        );
    }

    // Use custom background color if provided, otherwise default gray
    const style = backgroundColor ? { backgroundColor } : undefined;
    const className = backgroundColor
        ? 'rounded-full px-3 py-1 text-sm transition-colors text-gray-800 hover:brightness-95'
        : 'rounded-full px-3 py-1 text-sm transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';

    return (
        <button type="button" onClick={onClick} className={className} style={style}>
            {id}
        </button>
    );
};

export const Pill = memo(PillInternal);
