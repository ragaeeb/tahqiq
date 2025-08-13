'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type JsonObject = Record<string, Record<number | string, unknown> | unknown[]>;

type Props = {
    /** Comma separated string of extensions */
    allowedExtensions?: string;
    description?: string;
    maxFiles?: number;
    onFiles: (map: Record<string, File | JsonObject | string>) => void;
    title?: string;
};

/**
 * React component that enables drag-and-drop uploading of a single JSON file and passes its parsed contents to a callback.
 * Provides visual feedback when files are dragged over the drop zone.
 *
 * @param onFile - Callback invoked with the parsed JSON object when a valid file is dropped.
 *
 * @remark
 * Accepts `.json` extension or the allowed extensions.
 */
export default function JsonDropZone({
    allowedExtensions = '.json',
    description = 'Drop your transcript JSON file to start editing',
    maxFiles = 1,
    onFiles,
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

            const normalizedAllowedExtensions = allowedExtensions.split(',').map((e) => e.trim().toLowerCase());

            const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
                normalizedAllowedExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
            );

            if (files.length === 0 || files.length > maxFiles) {
                return;
            }

            try {
                const result: Record<string, File | JsonObject | string> = {};

                for (const file of files) {
                    result[file.name] = file;

                    if (file.name.endsWith('.json')) {
                        result[file.name] = JSON.parse(await file.text());
                    } else if (file.name.endsWith('.txt')) {
                        result[file.name] = await file.text();
                    }
                }

                onFiles(result);
            } catch (error) {
                console.error('Error parsing JSON file:', error);
            }
        },
        [onFiles, maxFiles, allowedExtensions],
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
