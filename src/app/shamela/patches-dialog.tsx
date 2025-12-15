'use client';

import { CopyIcon, DownloadIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { downloadFile } from '@/lib/domUtils';
import { usePatchStore } from '@/stores/patchStore';

/**
 * Dialog content for viewing and exporting tracked patches.
 */
export function PatchesDialogContent() {
    const patches = usePatchStore((state) => state.patches);
    const bookId = usePatchStore((state) => state.bookId);
    const clearPatches = usePatchStore((state) => state.clearPatches);
    const exportPatches = usePatchStore((state) => state.exportPatches);

    const handleCopy = () => {
        const data = exportPatches();
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        toast.success('Copied patches to clipboard');
    };

    const handleDownload = () => {
        const data = exportPatches();
        const filename = bookId ? `patches-${bookId}.json` : `patches-${Date.now()}.json`;
        downloadFile(filename, JSON.stringify(data, null, 2));
    };

    const handleClear = () => {
        clearPatches();
        toast.success('Cleared all patches');
    };

    return (
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
            <DialogHeader>
                <DialogTitle>Tracked Patches</DialogTitle>
                <DialogDescription>
                    {patches.length === 0
                        ? 'No patches have been tracked yet. Edit page content to create patches.'
                        : `${patches.length} patch${patches.length === 1 ? '' : 'es'} tracked for this book.`}
                </DialogDescription>
            </DialogHeader>

            {patches.length > 0 && (
                <>
                    <div className="flex gap-2 border-b py-2">
                        <Button onClick={handleCopy} size="sm" variant="outline">
                            <CopyIcon className="mr-2 h-4 w-4" />
                            Copy JSON
                        </Button>
                        <Button onClick={handleDownload} size="sm" variant="outline">
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={handleClear} size="sm" variant="destructive">
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Clear All
                        </Button>
                    </div>

                    <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-3 pr-4">
                            {patches.map((patch, index) => (
                                <div
                                    key={`${patch.pageId}-${patch.field}-${patch.createdAt}`}
                                    className="rounded-lg border bg-gray-50 p-3"
                                >
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="font-medium text-gray-500 text-xs">#{index + 1}</span>
                                        <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700 text-xs">
                                            Page {patch.pageId}
                                        </span>
                                        <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-700 text-xs">
                                            {patch.field}
                                        </span>
                                        <span className="ml-auto text-gray-400 text-xs">
                                            {new Date(patch.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-gray-100 p-2 font-mono text-gray-700 text-xs">
                                        {patch.diff}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </>
            )}
        </DialogContent>
    );
}
