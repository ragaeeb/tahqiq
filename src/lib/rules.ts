import {
    applyTokenMappings,
    type PatternTypeKey,
    type SplitRule,
    Token,
    type TokenMapping,
    withCapture,
} from 'flappa-doormal';
import { Markers } from './constants';

export const getPatternKey = (rule: SplitRule): PatternTypeKey => {
    if ('lineStartsWith' in rule) {
        return 'lineStartsWith';
    }
    if ('lineStartsAfter' in rule) {
        return 'lineStartsAfter';
    }
    if ('lineEndsWith' in rule) {
        return 'lineEndsWith';
    }
    if ('template' in rule) {
        return 'template';
    }
    return 'regex';
};

export const getPatternValueString = (rule: SplitRule, key: PatternTypeKey) => {
    if (key === 'template') {
        return String((rule as any).template ?? '');
    }
    if (key === 'regex') {
        return String((rule as any).regex ?? '');
    }
    return (((rule as any)[key] as string[]) ?? []).join('\n');
};

export const applyTokenMappingsToRule = (rule: SplitRule, mappings: TokenMapping[]): SplitRule => {
    const key = getPatternKey(rule);
    if (key === 'regex') {
        return rule;
    }
    if (key === 'template') {
        const template = applyTokenMappings((rule as any).template ?? '', mappings);
        return { ...(rule as any), template };
    }
    const patterns = ((rule as any)[key] as string[]) ?? [];
    return { ...(rule as any), [key]: patterns.map((p) => applyTokenMappings(p, mappings)) };
};

export const doesRuleAlreadyExist = (rules: SplitRule[], pattern: string) => {
    const alreadyExists = rules.some((r) => {
        if ('lineStartsWith' in r) {
            return r.lineStartsWith.includes(pattern);
        }
        if ('lineStartsAfter' in r) {
            return r.lineStartsAfter.includes(pattern);
        }
        if ('lineEndsWith' in r) {
            return r.lineEndsWith.includes(pattern);
        }
        if ('template' in r) {
            return r.template === pattern;
        }
        if ('regex' in r) {
            return r.regex === pattern;
        }

        return false;
    });

    return alreadyExists;
};

export const SUGGESTED_RULES: Array<{ label: string; rule: SplitRule }> = [
    { label: 'Bab', rule: { fuzzy: true, lineStartsWith: [`${Token.BAB} `], meta: { type: Markers.Chapter } } },
    { label: 'Basmalah', rule: { fuzzy: true, lineStartsWith: [Token.BASMALAH] } },
    { label: 'Fasl', rule: { fuzzy: true, lineStartsWith: [`${Token.FASL} `] } },
    { label: 'Heading (##)', rule: { lineStartsAfter: ['## '], meta: { type: Markers.Chapter } } },
    { label: 'Kitab', rule: { fuzzy: true, lineStartsWith: [`${Token.KITAB} `], meta: { type: Markers.Book } } },
    { label: 'List Item', rule: { lineStartsAfter: [`${withCapture(Token.RAQMS, 'num')} ${Token.DASH} `] } },
    { label: 'Naql', rule: { fuzzy: true, lineStartsWith: [`${Token.NAQL} `], pageStartGuard: Token.TARQIM } },
];
