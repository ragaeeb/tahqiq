import { memo } from 'react';

type PillProps = { id: string; isFreeLimit?: boolean; isSelected: boolean; onClick: () => void };

const PillInternal = ({ id, isFreeLimit, isSelected, onClick }: PillProps) => {
    let className = 'rounded-full px-3 py-1 text-sm transition-colors ';

    if (isSelected) {
        className += 'bg-blue-500 text-white';
    } else if (isFreeLimit) {
        className += 'bg-emerald-500 text-white ring-2 ring-emerald-300';
    } else {
        className += 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }

    return (
        <button type="button" onClick={onClick} className={className}>
            {id}
        </button>
    );
};

export const Pill = memo(PillInternal);
