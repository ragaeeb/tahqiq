import { XIcon } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { Badge } from './badge';
import { Button } from './button';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

type TagInputProps = Omit<InputProps, 'onChange' | 'value'> & {
    onChange: (value: string[]) => void;
    value?: readonly string[];
};

const TagInput = forwardRef<HTMLInputElement, TagInputProps>((props, ref) => {
    const { className, onChange, value = [], ...domProps } = props;

    const [pendingDataPoint, setPendingDataPoint] = useState('');

    useEffect(() => {
        if (pendingDataPoint.includes(',')) {
            // Split by comma and filter/map in one pass
            const newTags = pendingDataPoint.split(',').map((x) => x.trim());

            // Create a Set to remove duplicates and combine with existing values
            const newDataPoints = new Set([...newTags, ...value]);
            onChange([...newDataPoints]);
            setPendingDataPoint('');
        }
    }, [pendingDataPoint, onChange, value]);

    const addPendingDataPoint = () => {
        const trimmedDataPoint = pendingDataPoint.trim();
        if (trimmedDataPoint.length > 0) {
            const newDataPoints = new Set([trimmedDataPoint, ...value]);
            onChange([...newDataPoints]);
            setPendingDataPoint('');
        }
    };

    return (
        <div
            className={cn(
                'flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-950 has-[:focus-visible]:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:has-[:focus-visible]:ring-neutral-300',
                className,
            )}
        >
            {value.map((item) => (
                <Badge key={item} variant={'secondary'}>
                    {item}
                    <Button
                        className={'ml-2 h-3 w-3'}
                        onClick={() => {
                            onChange(value.filter((i) => i !== item));
                        }}
                        size={'icon'}
                        type="button"
                        variant={'ghost'}
                    >
                        <XIcon className={'w-3'} />
                    </Button>
                </Badge>
            ))}
            <input
                className={'flex-1 outline-none placeholder:text-neutral-500 dark:placeholder:text-neutral-400'}
                onChange={(e) => setPendingDataPoint(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addPendingDataPoint();
                    } else if (e.key === 'Backspace' && pendingDataPoint.length === 0 && value.length > 0) {
                        e.preventDefault();
                        onChange(value.slice(0, -1));
                    }
                }}
                value={pendingDataPoint}
                {...domProps}
                ref={ref}
            />
        </div>
    );
});

TagInput.displayName = 'TagInput';

export { TagInput };
