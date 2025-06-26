/**
 * Pastes text at the current cursor position in a text area
 * First attempts to use document.execCommand, then falls back to setRangeText if available
 * Dispatches an input event to ensure React and other frameworks detect the change
 *
 * @param input - The HTML textarea element to paste text into
 * @param text - The string content to be pasted
 */
export const pasteText = (input: HTMLTextAreaElement, text: string) => {
    const isSuccess = document.execCommand?.('insertText', false, text);

    // Fallback #1: modern browsers with setRangeText
    if (!isSuccess && typeof input.setRangeText === 'function') {
        const start = input.selectionStart;
        input.setRangeText(text);
        input.selectionStart = input.selectionEnd = start + text.length;

        // Fire native input event so React or others can track changes
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
    }

    // Fallback #2: last-ditch replacement of the entire value
    if (!isSuccess) {
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
};

/**
 * Maps a filename to its corresponding MIME type based on file extension
 * Supports common file types including JSON, CSV, TXT, HTML, XML
 * Falls back to 'text/plain' if the extension is not recognized
 *
 * @param fileName - The name of the file including its extension
 * @returns The MIME type string corresponding to the file extension
 */
const mapFileNameToMimeType = (fileName: string) => {
    if (fileName.endsWith('.json')) {
        return 'application/json';
    }

    if (fileName.endsWith('.csv')) {
        return 'text/csv';
    }

    if (fileName.endsWith('.txt')) {
        return 'text/plain';
    }

    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
        return 'text/html';
    }

    if (fileName.endsWith('.xml')) {
        return 'application/xml';
    }

    return 'text/plain';
};

/**
 * Creates and triggers a download of a file with the specified content
 * Automatically determines MIME type based on filename if not provided
 * Creates a temporary anchor element to initiate the download
 * Cleans up resources after download is initiated
 *
 * @param fileName - The name to be given to the downloaded file
 * @param content - The string content to be written to the file
 * @param mimeType - Optional MIME type override; if not provided, determined from filename
 */
export const downloadFile = (fileName: string, content: string, mimeType?: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType || mapFileNameToMimeType(fileName) });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();

    setTimeout(() => {
        URL.revokeObjectURL(element.href);
        document.body.removeChild(element);
    }, 0);
};

export const autoResize = (textArea: HTMLTextAreaElement) => {
    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight}px`;
};

export const updateElementValue = (
    element: HTMLInputElement | HTMLTextAreaElement,
    newValue: string,
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
) => {
    // Update the element value
    element.value = newValue;

    // Trigger onChange event if provided
    if (onChange) {
        const syntheticEvent = {
            currentTarget: element,
            target: element,
        } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

        onChange(syntheticEvent);
    }
};

export const applyFormattingOnSelection = (
    element: HTMLInputElement | HTMLTextAreaElement,
    formatter: (text: string) => string,
): string => {
    const selectionEnd = element.selectionEnd ?? 0;
    const selectionStart = element.selectionStart ?? 0;
    const value = element.value ?? '';

    if (selectionEnd > selectionStart) {
        // Format only selected text
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);

        return before + formatter(selected) + after;
    }

    // Format entire text if no selection
    return formatter(value);
};
