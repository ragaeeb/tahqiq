import { memo } from 'react';

type PillProps = { id: string; isSelected: boolean; onClick: () => void };

const PillInternal = ({ id, isSelected, onClick }: PillProps) => {
    const className = isSelected
        ? 'rounded-full px-3 py-1 text-sm transition-colors bg-blue-500 text-white'
        : 'rounded-full px-3 py-1 text-sm transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';

    return (
        <button type="button" onClick={onClick} className={className}>
            {id}
        </button>
    );
};

export const Pill = memo(PillInternal);
