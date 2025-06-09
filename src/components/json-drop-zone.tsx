'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type JsonObject = Record<string, Record<number | string, unknown> | unknown[]>;

type Props = {
    description?: string;
    maxFiles?: number;
    onFile: (map: Record<string, JsonObject>) => void;
    title?: string;
};

/**
 * React component that enables drag-and-drop uploading of a single JSON file and passes its parsed contents to a callback.
 * Provides visual feedback when files are dragged over the drop zone.
 *
 * @param onFile - Callback invoked with the parsed JSON object when a valid file is dropped.
 *
 * @remark
 * Only accepts exactly one file with a `.json` extension. If multiple or non-JSON files are dropped, the callback is not invoked.
 */
export default function JsonDropZone({
    description = 'Drop your transcript JSON file to start editing',
    maxFiles = 1,
    onFile,
    title = 'Drag & Drop JSON file',
}: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        // Check if we're leaving the actual drop zone and not entering a child element
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(
        async (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.name.endsWith('.json'));

            if (files.length !== maxFiles) {
                return;
            }

            try {
                const result: Record<string, JsonObject> = {};

                for (const file of files) {
                    const data = JSON.parse(await file.text());
                    result[file.name] = data;
                }

                onFile(result);
            } catch (error) {
                console.error('Error parsing JSON file:', error);
            }
        },
        [onFile, maxFiles],
    );

    useEffect(() => {
        const dropZoneElement = dropZoneRef.current;
        if (!dropZoneElement) return;

        // Add event listeners to the drop zone element instead of document.body
        dropZoneElement.addEventListener('dragenter', handleDragEnter as EventListener);
        dropZoneElement.addEventListener('dragleave', handleDragLeave as EventListener);
        dropZoneElement.addEventListener('dragover', handleDragOver as EventListener);
        dropZoneElement.addEventListener('drop', handleDrop);

        return () => {
            // Clean up event listeners
            dropZoneElement.removeEventListener('dragenter', handleDragEnter as EventListener);
            dropZoneElement.removeEventListener('dragleave', handleDragLeave as EventListener);
            dropZoneElement.removeEventListener('dragover', handleDragOver as EventListener);
            dropZoneElement.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    return (
        <div
            className={`w-full p-8 border-2 border-dashed rounded-lg transition-colors ${
                isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            ref={dropZoneRef}
        >
            <div className="flex flex-col items-center justify-center text-center">
                <svg
                    className={`w-16 h-16 mb-4 ${isDragging ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M19 14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6M12 4v12M8 8l4-4 4 4" />
                </svg>
                <h3 className="mb-2 text-lg font-medium">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    );
}
