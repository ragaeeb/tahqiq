import { memo } from 'react';

const PillInternal = ({ id, isSelected, onClick }: { id: string; isSelected: boolean; onClick: () => void }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {id}
        </button>
    );
};

export const Pill = memo(PillInternal);
