import { record } from 'nanolytics';
import React from 'react';

import JsonDropZone from '@/components/json-drop-zone';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

interface PdfDialogProps {
    page: number;
}

export function PdfDialog({ page }: PdfDialogProps) {
    const pdfUrl = useManuscriptStore((state) => state.pdfUrl);
    const setPdfUrl = useManuscriptStore((state) => state.setPdfUrl);

    if (pdfUrl) {
        return (
            <DialogContent className="fixed top-0 right-0 left-auto h-full w-1/2 max-w-none translate-x-0 translate-y-0 rounded-none border-l border-t-0 border-r-0 border-b-0 p-0 flex flex-col">
                <DialogHeader className="p-4 border-b bg-gray-50 flex-shrink-0">
                    <DialogTitle>PDF</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <iframe
                        className="w-full h-full"
                        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&page=${page}`}
                        style={{
                            border: 'none',
                        }}
                        title={`PDF Viewer - Page ${page}`}
                    />
                </div>
            </DialogContent>
        );
    }

    if (!pdfUrl) {
        return (
            <DialogContent className="fixed top-0 right-0 left-auto h-full w-1/2 max-w-none translate-x-0 translate-y-0 rounded-none border-l border-t-0 border-r-0 border-b-0 p-0 flex flex-col">
                <DialogHeader className="p-4 border-b bg-gray-50 flex-shrink-0">
                    <DialogTitle>PDF</DialogTitle>
                </DialogHeader>

                <JsonDropZone
                    allowedExtensions=".pdf"
                    description="Drop the PDF"
                    maxFiles={1}
                    onFiles={(map) => {
                        const [fileName] = Object.keys(map);

                        record('LoadPDF', fileName);

                        const url = URL.createObjectURL(map[fileName] as File);
                        setPdfUrl(url);
                    }}
                />
            </DialogContent>
        );
    }
}
