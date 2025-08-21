import { XIcon } from 'lucide-react';
import { record } from 'nanolytics';
import React from 'react';

import SubmittableInput from '@/components/submittable-input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type PdfDialogProps = {
    onClose: () => void;
    page: number;
};

const DialogContainer = ({
    children,
    onCloseClicked,
}: Readonly<{
    children: React.ReactNode;
    onCloseClicked: () => void;
}>) => {
    return (
        <Dialog modal={false} open>
            <DialogContent className="fixed top-0 right-0 left-auto h-full w-1/2 max-w-none translate-x-0 translate-y-0 rounded-none border-l border-t-0 border-r-0 border-b-0 p-0 flex flex-col [&>button]:hidden">
                <DialogHeader className="p-4 border-b bg-gray-50 flex-shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="text-left">PDF</DialogTitle>
                    <DialogClose asChild>
                        <Button
                            className="rounded-sm p-1 opacity-70 hover:opacity-100 hover:bg-red-100"
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
                        className="w-full h-full"
                        key={page}
                        src={`${url}#navpanes=0&scrollbar=0&page=${page}`}
                        style={{
                            border: 'none',
                        }}
                        title={`PDF Viewer - Page ${page}`}
                    />
                </div>
            </DialogContainer>
        );
    }

    return (
        <DialogContainer onCloseClicked={onClose}>
            <SubmittableInput
                className="border-1 shadow-none focus:ring-0 focus:outline-none"
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
