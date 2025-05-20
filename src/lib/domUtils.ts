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

const mapFileNameToMimeType = (fileName: string) => {
    if (fileName.endsWith('.json')) {
        return 'application/json';
    }

    return 'text/plain';
};

export const downloadFile = (fileName: string, content: string, mimeType?: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType || mapFileNameToMimeType(fileName) });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
};
