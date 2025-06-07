import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface HighlightableTextareaRef {
    blur: () => void;
    focus: () => void;
    getValue: () => string;
    select: () => void;
    setSelectionRange: (start: number, end: number) => void;
    setValue: (value: string) => void;
}

interface HighlightableTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    autoResize?: boolean;
    className?: string;
    defaultValue?: string;
    dir?: 'ltr' | 'rtl';
    lineHighlights?: { [lineNumber: number]: string }; // lineNumber (1-based) -> CSS color/class
    onChange?: (value: string) => void;
    rows?: number;
    value?: string;
}

const HighlightableTextarea = forwardRef<HighlightableTextareaRef, HighlightableTextareaProps>(
    (
        {
            autoResize = true,
            className = '',
            defaultValue = '',
            dir = 'ltr',
            lineHighlights = {},
            onChange,
            rows = 4,
            style,
            value,
            ...props
        },
        ref,
    ) => {
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const highlightLayerRef = useRef<HTMLDivElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        const [internalValue, setInternalValue] = useState(value ?? defaultValue);
        const [textareaHeight, setTextareaHeight] = useState<number | undefined>();

        // Use controlled value if provided, otherwise use internal state
        const currentValue = value !== undefined ? value : internalValue;

        const handleAutoResize = useCallback(
            (element: HTMLTextAreaElement) => {
                if (!autoResize) return;

                element.style.height = 'auto';
                const newHeight = element.scrollHeight;
                element.style.height = `${newHeight}px`;
                setTextareaHeight(newHeight);
            },
            [autoResize],
        );

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;

                if (value === undefined) {
                    setInternalValue(newValue);
                }

                onChange?.(newValue);
                handleAutoResize(e.target);
            },
            [value, onChange, handleAutoResize],
        );

        const syncScroll = useCallback(() => {
            if (textareaRef.current && highlightLayerRef.current) {
                highlightLayerRef.current.scrollTop = textareaRef.current.scrollTop;
                highlightLayerRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        }, []);

        // Expose methods through ref
        useImperativeHandle(
            ref,
            () => ({
                blur: () => textareaRef.current?.blur(),
                focus: () => textareaRef.current?.focus(),
                getValue: () => currentValue,
                select: () => textareaRef.current?.select(),
                setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
                setValue: (newValue: string) => {
                    if (value === undefined) {
                        setInternalValue(newValue);
                    }
                    if (textareaRef.current) {
                        textareaRef.current.value = newValue;
                        handleAutoResize(textareaRef.current);
                    }
                },
            }),
            [currentValue, value, handleAutoResize],
        );

        // Sync styles between textarea and highlight layer
        const syncStyles = useCallback(() => {
            if (textareaRef.current && highlightLayerRef.current) {
                const computedStyle = getComputedStyle(textareaRef.current);
                const highlightLayer = highlightLayerRef.current;

                // Copy essential styles from textarea to highlight layer
                highlightLayer.style.padding = computedStyle.padding;
                highlightLayer.style.fontSize = computedStyle.fontSize;
                highlightLayer.style.fontFamily = computedStyle.fontFamily;
                highlightLayer.style.lineHeight = computedStyle.lineHeight;
                highlightLayer.style.letterSpacing = computedStyle.letterSpacing;
                highlightLayer.style.wordSpacing = computedStyle.wordSpacing;
                highlightLayer.style.textIndent = computedStyle.textIndent;
            }
        }, []);

        // Handle auto-resize on mount and value changes
        useEffect(() => {
            if (textareaRef.current && autoResize) {
                handleAutoResize(textareaRef.current);
            }
            syncStyles();
        }, [currentValue, handleAutoResize, autoResize, syncStyles]);

        // Generate highlighted content
        const generateHighlightedContent = useCallback(() => {
            const lines = currentValue.split('\n');

            return lines.map((line, index) => {
                const highlight = lineHighlights[index];

                if (highlight) {
                    const isColorValue =
                        highlight.startsWith('#') ||
                        highlight.startsWith('rgb') ||
                        highlight.startsWith('hsl') ||
                        [
                            'black',
                            'blue',
                            'gray',
                            'green',
                            'orange',
                            'pink',
                            'purple',
                            'red',
                            'white',
                            'yellow',
                        ].includes(highlight.toLowerCase());

                    return (
                        <div
                            className={isColorValue ? undefined : highlight}
                            key={index}
                            style={isColorValue ? { backgroundColor: highlight } : undefined}
                        >
                            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                        </div>
                    );
                }

                return <div key={index}>{line || '\u00A0'}</div>;
            });
        }, [currentValue, lineHighlights]);

        const containerStyle: React.CSSProperties = {
            display: 'block',
            position: 'relative',
            width: '100%',
            ...style,
        };

        const baseTextareaStyle: React.CSSProperties = {
            background: 'transparent',
            boxSizing: 'border-box',
            caretColor: '#000000', // Black caret for visibility
            color: 'transparent', // Make text transparent
            height: textareaHeight ? `${textareaHeight}px` : undefined,
            minHeight: 'auto',
            position: 'relative',
            resize: autoResize ? 'none' : 'vertical',
            width: '100%',
            zIndex: 2,
        };

        const highlightLayerStyle: React.CSSProperties = {
            border: 'transparent solid 1px',
            bottom: 0,
            boxSizing: 'border-box',
            color: 'inherit', // Show text color in highlight layer
            direction: dir,
            fontFamily: 'inherit',
            fontSize: 'inherit',
            height: textareaHeight ? `${textareaHeight}px` : undefined,
            left: 0,
            lineHeight: 'inherit',
            margin: 0,
            overflow: 'hidden',
            padding: textareaRef.current ? getComputedStyle(textareaRef.current).padding : '8px 12px',
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
            top: 0,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            zIndex: 1,
        };

        return (
            <div ref={containerRef} style={containerStyle}>
                {/* Highlight layer */}
                <div aria-hidden="true" ref={highlightLayerRef} style={highlightLayerStyle}>
                    {generateHighlightedContent()}
                </div>

                {/* Textarea */}
                <textarea
                    className={className}
                    dir={dir}
                    onChange={handleChange}
                    onScroll={syncScroll}
                    ref={textareaRef}
                    rows={rows}
                    style={baseTextareaStyle}
                    value={currentValue}
                    {...props}
                />
            </div>
        );
    },
);

HighlightableTextarea.displayName = 'HighlightableTextarea';

export default HighlightableTextarea;
