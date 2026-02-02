'use client';

import { SettingsIcon } from 'lucide-react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BookSegmentationOptions } from '@/stores/segmentationStore/types';

type Props = { options: BookSegmentationOptions };

export const SegmentationOptionsContent = ({ options }: Props) => {
    const jsonValue = JSON.stringify(options, null, 4);

    return (
        <DialogContent className="!max-w-[90vw] flex h-[85vh] w-[90vw] flex-col">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <SettingsIcon className="h-5 w-5" />
                    Segmentation Options
                </DialogTitle>
                <DialogDescription>
                    These options were used to segment the original text into these excerpts.
                </DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
                <Label htmlFor="segmentation-options-json" className="font-semibold text-gray-700">
                    JSON Configuration
                </Label>
                <Textarea
                    id="segmentation-options-json"
                    className="flex-1 resize-none overflow-auto rounded-md border bg-gray-50 p-4 font-mono text-sm"
                    readOnly
                    defaultValue={jsonValue}
                    spellCheck={false}
                />
            </div>
        </DialogContent>
    );
};
