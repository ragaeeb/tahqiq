'use client';

import { type SegmentationOptions, validateRules } from 'flappa-doormal';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSegmentationStore } from '@/stores/segmentationStore/useSegmentationStore';

export const JsonTab = () => {
    const options = useSegmentationStore((s) => s.options);
    const setOptions = useSegmentationStore((s) => s.setOptions);

    const initialValue = JSON.stringify(options, null, 4);

    return (
        <form
            className="flex h-full flex-col gap-3 p-4"
            onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const value = formData.get('options') as string;

                try {
                    const parsed = JSON.parse(value) as SegmentationOptions;

                    const issues = validateRules(parsed.rules ?? []).filter(Boolean);
                    if (issues.length > 0) {
                        toast.error(`Invalid rules:\n${issues.map((issue) => JSON.stringify(issue)).join('\n')}`);

                        return;
                    }

                    setOptions(parsed);
                } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Invalid JSON');
                }
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor="segmentation-options-json">Options</Label>
                <Button size="sm" type="submit">
                    Save
                </Button>
            </div>

            <Textarea
                className="min-h-0 flex-1 resize-none overflow-y-auto font-mono text-sm"
                defaultValue={initialValue}
                id="segmentation-options-json"
                key={initialValue}
                name="options"
                spellCheck={false}
                style={{ fieldSizing: 'fixed' }}
            />
        </form>
    );
};
