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

    if (!isSuccess && typeof input.setRangeText === 'function') {
        const start = input.selectionStart;
        input.setRangeText(text);
        input.selectionStart = input.selectionEnd = start + text.length;

        // Fire native input event so React or others can track changes
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
