import { VALIDATION_ERROR_TYPE_INFO, type ValidationError, type ValidationErrorType } from 'wobble-bibble';

type GroupedError = {
    message: string;
    items: { id: string; range: { start: number; end: number } }[];
    type?: ValidationErrorType;
};

export const groupErrorMessages = (errors: ValidationError[]) => {
    const groups = new Map<string, GroupedError>();
    const filteredErrors = errors.filter(
        (e) => e.type !== 'mismatched_colons' && e.type !== 'archaic_register' && e.type !== 'missing_id_gap',
    );

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
            const info = VALIDATION_ERROR_TYPE_INFO[type];
            description = info?.description || err.message.replace(/ in "[^"]+"/, '').trim();
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
