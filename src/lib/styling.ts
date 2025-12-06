import { getUnbalancedErrors } from 'baburchi';

/**
 * Gets character-level error highlights for use with HighlightableTextarea.
 * Returns an array of CharacterRange objects with absolute positioning.
 */
export const getCharacterErrorHighlights = (text: string) => {
    const errors = getUnbalancedErrors(text);

    return errors.map((error) => {
        let className = '';
        let style: React.CSSProperties = {};

        if (error.type === 'quote') {
            className = 'bg-red-300';
            style = { backgroundColor: '#fca5a5' };
        } else if (error.type === 'bracket') {
            if (error.reason === 'mismatched') {
                className = 'bg-orange-300';
                style = { backgroundColor: '#fed7aa' };
            } else {
                className = 'bg-yellow-300';
                style = { backgroundColor: '#fde68a' };
            }
        }

        return { className, end: error.absoluteIndex + 1, start: error.absoluteIndex, style };
    });
};
