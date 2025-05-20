'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root>;

/****
 * Renders a customizable slider component supporting single or multiple thumbs.
 *
 * The slider can be controlled or uncontrolled, and adapts its appearance and behavior based on orientation, disabled state, and provided value or defaultValue arrays.
 *
 * @param className - Additional class names for custom styling.
 * @param defaultValue - Initial value(s) for uncontrolled usage.
 * @param max - Maximum slider value. Defaults to 100.
 * @param min - Minimum slider value. Defaults to 0.
 * @param value - Controlled value(s) for the slider.
 * @returns A styled slider UI element with track, range, and thumb(s).
 */
export function Slider({
    className,
    defaultValue: defaultValueProp,
    max = 100,
    min = 0,
    value: valueProp,
    ...rest
}: SliderProps) {
    const _values = React.useMemo(() => {
        if (Array.isArray(valueProp)) {
            return valueProp;
        }
        if (Array.isArray(defaultValueProp)) {
            return defaultValueProp;
        }
        return [min, max];
    }, [valueProp, defaultValueProp, min, max]);

    return (
        <SliderPrimitive.Root
            className={cn(
                'relative flex w-full touch-none items-center select-none ' +
                    'data-[disabled]:opacity-50 ' +
                    'data-[orientation=vertical]:h-full ' +
                    'data-[orientation=vertical]:min-h-44 ' +
                    'data-[orientation=vertical]:w-auto ' +
                    'data-[orientation=vertical]:flex-col',
                className,
            )}
            data-slot="slider"
            max={max}
            min={min}
            /* only pass defaultValue when defined (so its type is definitely number[]) */
            {...(defaultValueProp !== undefined ? { defaultValue: defaultValueProp } : {})}
            /* only pass value when defined (so its type is number[] not number[]|undefined) */
            {...(valueProp !== undefined ? { value: valueProp } : {})}
            {...rest}
        >
            <SliderPrimitive.Track
                className={cn(
                    'bg-muted relative grow overflow-hidden rounded-full ' +
                        'data-[orientation=horizontal]:h-1.5 ' +
                        'data-[orientation=horizontal]:w-full ' +
                        'data-[orientation=vertical]:h-full ' +
                        'data-[orientation=vertical]:w-1.5',
                )}
                data-slot="slider-track"
            >
                <SliderPrimitive.Range
                    className={cn(
                        'bg-primary absolute ' +
                            'data-[orientation=horizontal]:h-full ' +
                            'data-[orientation=vertical]:w-full',
                    )}
                    data-slot="slider-range"
                />
            </SliderPrimitive.Track>
            {_values.map((_, index) => (
                <SliderPrimitive.Thumb
                    className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                    data-slot="slider-thumb"
                    key={index}
                />
            ))}
        </SliderPrimitive.Root>
    );
}
