'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, 'onCheckedChange'> {
    onCheckedChange?: (checked: boolean, isShiftPressed: boolean) => void;
}

/**
 * Renders a styled checkbox component with support for custom classes and indicator icon.
 *
 * Combines Radix UI's checkbox functionality with predefined and custom styles, and displays a checkmark icon when checked.
 *
 * @param className - Additional CSS classes to apply to the checkbox root element.
 */
function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
    const shiftPressedRef = React.useRef(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        shiftPressedRef.current = event.shiftKey;
        if (props.onClick) {
            props.onClick(event);
        }
    };

    const handleCheckedChange = (checked: 'indeterminate' | boolean) => {
        if (onCheckedChange) {
            onCheckedChange(Boolean(checked), shiftPressedRef.current);
        }
        shiftPressedRef.current = false;
    };

    return (
        <CheckboxPrimitive.Root
            className={cn(
                'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:aria-invalid:ring-destructive/40',
                className,
            )}
            {...props}
            onCheckedChange={handleCheckedChange}
            onClick={handleClick}
        >
            <CheckboxPrimitive.Indicator
                className="flex items-center justify-center text-current transition-none"
                data-slot="checkbox-indicator"
            >
                <CheckIcon className="size-3.5" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
