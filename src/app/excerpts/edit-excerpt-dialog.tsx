'use client';

import { PencilIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createObjectDiff } from '@/lib/common';
import type { Excerpt } from '@/stores/excerptsStore/types';
import { TranslatorSelect } from './translation-tab/translator-select';

type EditExcerptDialogContentProps = {
    /** The excerpt data to edit */
    excerpt: Excerpt;
    /** Callback when dialog should close */
    onClose?: () => void;
    /** Callback to save updates */
    onUpdate: (id: string, updates: Partial<Omit<Excerpt, 'id'>>) => void;
};

/** Fields to exclude from diff comparison */
const EXCLUDE_KEYS = ['id', 'lastUpdatedAt'];

/**
 * Dialog content for editing all fields of an excerpt.
 * Uses uncontrolled inputs with validation on submit for better performance.
 */
export function EditExcerptDialogContent({ excerpt, onClose, onUpdate }: EditExcerptDialogContentProps) {
    const [validationError, setValidationError] = useState('');

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setValidationError('');

            const formData = new FormData(e.currentTarget);
            const str = (key: string) => (formData.get(key) as string) || undefined;
            const num = (key: string) => {
                const v = str(key)?.trim();
                return v ? Number.parseInt(v, 10) || undefined : undefined;
            };

            // Parse meta JSON
            const metaJson = str('meta')?.trim();
            let meta: Record<string, unknown> | undefined;
            if (metaJson) {
                try {
                    meta = JSON.parse(metaJson);
                } catch {
                    return setValidationError('Invalid JSON syntax in Meta field');
                }
            }

            const updated = {
                from: num('from'),
                meta,
                nass: str('nass'),
                text: str('text'),
                to: num('to'),
                translator: num('translator'),
            };

            const diff = createObjectDiff(excerpt, updated, { excludeKeys: EXCLUDE_KEYS });

            if (Object.keys(diff).length > 0) {
                record('EditExcerpt', excerpt.id);
                onUpdate(excerpt.id, diff);
            }

            onClose?.();
        },
        [excerpt, onUpdate, onClose],
    );

    return (
        <DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <PencilIcon className="h-5 w-5" />
                    Edit Excerpt: {excerpt.id}
                </DialogTitle>
                <DialogDescription>Edit all fields of this excerpt. Changes are saved on submit.</DialogDescription>
            </DialogHeader>

            <form className="flex flex-1 flex-col gap-4 overflow-y-auto" onSubmit={handleSubmit}>
                {/* Page numbers row */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="from">From Page</Label>
                        <Input defaultValue={excerpt.from} id="from" name="from" placeholder="Page" type="number" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="to">To Page</Label>
                        <Input defaultValue={excerpt.to ?? ''} id="to" name="to" placeholder="Optional" type="number" />
                    </div>
                </div>

                {/* Translator selector - uncontrolled with name for form submission */}
                <TranslatorSelect defaultValue={excerpt.translator?.toString()} name="translator" persist={false} />

                {/* Arabic text */}
                <div className="space-y-2">
                    <Label htmlFor="nass">Arabic Text</Label>
                    <Textarea
                        className="min-h-[100px] text-right font-arabic text-lg leading-relaxed"
                        defaultValue={excerpt.nass ?? ''}
                        dir="rtl"
                        id="nass"
                        name="nass"
                        placeholder="النص العربي..."
                    />
                </div>

                {/* Translation */}
                <div className="space-y-2">
                    <Label htmlFor="text">Translation</Label>
                    <Textarea
                        className="min-h-[80px]"
                        defaultValue={excerpt.text ?? ''}
                        id="text"
                        name="text"
                        placeholder="Translation..."
                    />
                </div>

                {/* Meta (JSON) */}
                <div className="space-y-2">
                    <Label htmlFor="meta">Meta (JSON)</Label>
                    <Textarea
                        className={`min-h-[60px] font-mono text-sm ${validationError ? 'border-red-500' : ''}`}
                        defaultValue={excerpt.meta ? JSON.stringify(excerpt.meta, null, 2) : ''}
                        id="meta"
                        name="meta"
                        placeholder='{"type": "chapter", "num": "5"}'
                    />
                    {validationError && <p className="text-red-500 text-sm">{validationError}</p>}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
