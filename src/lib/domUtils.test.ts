import { describe, expect, it, spyOn } from 'bun:test';

import { applyFormattingOnSelection, autoResize, updateElementValue } from './domUtils';

describe('domUtils', () => {
    describe('autoResize', () => {
        it('should resize textarea to fit content', () => {
            const textArea = {
                scrollHeight: 150,
                style: { height: '50px' },
            } as any;

            autoResize(textArea);

            expect(textArea.style.height).toBe('150px');
        });

        it('should handle textarea with zero scrollHeight', () => {
            const textArea = {
                scrollHeight: 0,
                style: { height: '50px' },
            } as any;

            autoResize(textArea);

            expect(textArea.style.height).toBe('0px');
        });
    });

    describe('updateElementValue', () => {
        it('should update element value without onChange callback', () => {
            const element = { value: '' } as any;

            updateElementValue(element, 'new value');

            expect(element.value).toBe('new value');
        });

        it('should update element value and call onChange for input element', () => {
            const element = { value: '' } as any;
            const onChange = spyOn({}, 'onChange').mockImplementation(() => {});

            updateElementValue(element, 'new value', onChange);

            expect(element.value).toBe('new value');
            expect(onChange).toHaveBeenCalledWith({
                currentTarget: element,
                target: element,
            });
        });

        it('should update element value and call onChange for textarea element', () => {
            const element = { value: '' } as any;
            const onChange = spyOn({}, 'onChange').mockImplementation(() => {});

            updateElementValue(element, 'textarea content', onChange);

            expect(element.value).toBe('textarea content');
            expect(onChange).toHaveBeenCalledWith({
                currentTarget: element,
                target: element,
            });
        });
    });

    describe('applyFormattingOnSelection', () => {
        it('should format selected text when there is a selection', () => {
            const element = {
                selectionEnd: 10,
                selectionStart: 5,
                value: 'Hello world test',
            } as any;

            const formatter = (text: string) => text.toUpperCase();

            const result = applyFormattingOnSelection(element, formatter);

            expect(result).toBe('Hello WORLd test');
        });

        it('should format entire text when no selection is made', () => {
            const element = {
                selectionEnd: 5,
                selectionStart: 5,
                value: 'hello world',
            } as any;

            const formatter = (text: string) => text.toUpperCase();

            const result = applyFormattingOnSelection(element, formatter);

            expect(result).toBe('HELLO WORLD');
        });

        it('should format entire text when selectionStart equals selectionEnd', () => {
            const element = {
                selectionEnd: 0,
                selectionStart: 0,
                value: 'test content',
            } as any;

            const formatter = (text: string) => `[${text}]`;

            const result = applyFormattingOnSelection(element, formatter);

            expect(result).toBe('[test content]');
        });

        it('should handle null/undefined selection values', () => {
            const element = {
                selectionEnd: undefined,
                selectionStart: null,
                value: 'test',
            } as any;

            const formatter = (text: string) => text.toUpperCase();

            const result = applyFormattingOnSelection(element, formatter);

            expect(result).toBe('TEST');
        });

        it('should handle null/undefined value', () => {
            const element = {
                selectionEnd: 0,
                selectionStart: 0,
                value: null,
            } as any;

            const formatter = (text: string) => text.toUpperCase();

            const result = applyFormattingOnSelection(element, formatter);

            expect(result).toBe('');
        });

        it('should handle complex formatting function', () => {
            const element = {
                selectionEnd: 5,
                selectionStart: 0,
                value: 'hello world',
            } as any;

            const formatter = (text: string) => `**${text}**`;

            const result = applyFormattingOnSelection(element, formatter);

            expect(result).toBe('**hello** world');
        });
    });
});
