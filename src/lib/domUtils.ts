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
