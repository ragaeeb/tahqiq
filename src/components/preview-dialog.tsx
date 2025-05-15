'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { selectCurrentTranscript } from '@/stores/selectors';
import { useTranscriptStore } from '@/stores/useTranscriptStore';

import { Textarea } from './ui/textarea';

export function PreviewDialog({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const transcript = useTranscriptStore(selectCurrentTranscript)!;

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="w-full">
                <DialogHeader>
                    <DialogTitle>Preview</DialogTitle>
                </DialogHeader>
                <div className="h-200">
                    <Textarea className="h-200" defaultValue={transcript.text} dir="rtl" />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(transcript.text!);
                            }}
                            type="submit"
                        >
                            Copy to Clipboard
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
