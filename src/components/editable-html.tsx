'use client';

import { forwardRef, useCallback } from 'react';

type EditableHTMLProps = {
    className?: string;
    dir?: 'ltr' | 'rtl';
    html: string;
    onBlur?: () => void;
    onChange?: (evt: { target: { value: string } }) => void;
};

/**
 * A lightweight contenteditable component for editing HTML content.
 * Alternative to react-contenteditable with full React 19 compatibility.
 *
 * Key differences from a regular input:
 * - Preserves HTML structure (links, spans, etc.)
 * - Uses dangerouslySetInnerHTML for initial content
 * - Reports changes via innerHTML, not textContent
 */
const EditableHTML = forwardRef<HTMLDivElement, EditableHTMLProps>(
    ({ className, dir, html, onBlur, onChange }, ref) => {
        const handleInput = useCallback(
            (e: React.FormEvent<HTMLDivElement>) => {
                onChange?.({ target: { value: e.currentTarget.innerHTML } });
            },
            [onChange],
        );

        return (
            // biome-ignore lint/a11y/useSemanticElements: contenteditable div is intentionally interactive for rich text editing
            <div
                className={className}
                contentEditable
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for rich HTML content editing
                dangerouslySetInnerHTML={{ __html: html }}
                dir={dir}
                onBlur={onBlur}
                onInput={handleInput}
                ref={ref}
                role="textbox"
                suppressContentEditableWarning
                tabIndex={0}
            />
        );
    },
);

EditableHTML.displayName = 'EditableHTML';

export default EditableHTML;
