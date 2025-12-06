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
 *
 * SECURITY: The `html` prop is rendered via dangerouslySetInnerHTML.
 * Callers MUST sanitize the HTML before passing it to this component.
 * to remove potentially dangerous elements before rendering.
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
                // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML must be sanitized by caller
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
