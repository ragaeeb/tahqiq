'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface InspectorSheetProps {
    segmentId: string | null;
    segmentText: string | undefined;
    onClose: () => void;
}

export function InspectorSheet({ segmentId, segmentText, onClose }: InspectorSheetProps) {
    return (
        <Sheet
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
            open={!!segmentId}
            modal={false}
        >
            <SheetContent
                side="right"
                className="sm:max-w-md"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <SheetHeader>
                    <SheetTitle>Arabic Reference: {segmentId}</SheetTitle>
                    <SheetDescription>
                        Compare the source text with your translation to resolve validation errors.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4 flex-1 overflow-y-auto px-4">
                    {segmentText ? (
                        <div
                            className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 font-arabic text-base leading-relaxed"
                            dir="rtl"
                        >
                            {segmentText}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">Segment not found</div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
