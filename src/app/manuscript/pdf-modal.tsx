import { XIcon } from 'lucide-react';
import { record } from 'nanolytics';
import type React from 'react';

import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type PdfDialogProps = { onClose: () => void; page: number };

const DialogContainer = ({
    children,
    onCloseClicked,
}: Readonly<{ children: React.ReactNode; onCloseClicked: () => void }>) => {
    return (
        <Dialog modal={false} open>
            <DialogContent className="fixed top-0 right-0 left-auto flex h-full w-1/2 max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-t-0 border-r-0 border-b-0 border-l p-0 [&>button]:hidden">
                <DialogHeader className="flex flex-shrink-0 flex-row items-center justify-between border-b bg-gray-50 p-4">
                    <DialogTitle className="text-left">PDF</DialogTitle>
                    <DialogDescription className="sr-only">PDF Viewer for current page</DialogDescription>
                    <DialogClose asChild>
                        <Button
                            className="rounded-sm p-1 opacity-70 hover:bg-red-100 hover:opacity-100"
                            onClick={onCloseClicked}
                            size="sm"
                            variant="ghost"
                        >
                            <XIcon />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                {children}
            </DialogContent>
        </Dialog>
    );
};

export function PdfDialog({ onClose, page }: PdfDialogProps) {
    const url = useManuscriptStore((state) => state.url);
    const setUrl = useManuscriptStore((state) => state.setUrl);

    if (url) {
        return (
            <DialogContainer onCloseClicked={onClose}>
                <div className="flex-1 overflow-hidden">
                    <iframe
                        className="h-full w-full"
                        key={page}
                        src={`${url}#navpanes=0&scrollbar=0&page=${page}`}
                        style={{ border: 'none' }}
                        title={`PDF Viewer - Page ${page}`}
                    />
                </div>
            </DialogContainer>
        );
    }

    return (
        <DialogContainer onCloseClicked={onClose}>
            <SubmittableInput
                className="border-1 shadow-none focus:outline-none focus:ring-0"
                defaultValue={url}
                name="pdfUrl"
                onSubmit={(value) => {
                    record('LoadPDF', value);
                    setUrl(value);
                }}
                placeholder="Enter PDF url..."
            />
        </DialogContainer>
    );
}
