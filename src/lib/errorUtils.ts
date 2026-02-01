import type { ValidationError, ValidationErrorType } from 'wobble-bibble';

type GroupedError = {
    message: string;
    items: { id: string; range: { start: number; end: number } }[];
    type?: ValidationErrorType;
};

export const filterNoisyError = (e: ValidationError) => e.type !== 'archaic_register' && e.type !== 'missing_id_gap';

export const groupErrorMessages = (errors: ValidationError[]) => {
    const groups = new Map<string, GroupedError>();
    const filteredErrors = errors.filter(filterNoisyError);

    for (const err of filteredErrors) {
        const isAlreadyTranslated = err.message.startsWith('Already Translated:');
        const type = err.type as ValidationErrorType;
        let key: string;
        let description: string;

        if (isAlreadyTranslated) {
            key = 'already_translated';
            description = 'IDs have already been translated';
        } else {
            key = type;
            description = err.message.replace(/ in "[^"]+"/, '').trim();
        }

        const existing = groups.get(key) || {
            items: [],
            message: description,
            type: isAlreadyTranslated ? undefined : type,
        };

        const id = err.id || '?';
        if (!existing.items.some((item) => item.id === id)) {
            existing.items.push({ id, range: err.range });
        }
        groups.set(key, existing);
    }
    return Array.from(groups.values());
};
