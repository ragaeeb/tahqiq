import { record } from 'nanolytics';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import SubmittableInput from '@/components/submittable-input';
import { readStreamedJson } from '@/lib/network';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

type DatasetLoaderProps<T> = {
    datasetKey: 'aslDataset' | 'shamelaDataset';
    onDataLoaded: (data: T, fileName?: string) => void;

    placeholder: string;
    description?: string;
    urlParam?: string;
    parseInput?: (input: string) => string | undefined;
    recordEventName: string;
};

export function DatasetLoader<T>({
    datasetKey,

    onDataLoaded,
    placeholder,
    description = 'Download from URL',
    urlParam = 'book',
    parseInput,
    recordEventName,
}: DatasetLoaderProps<T>) {
    const huggingfaceToken = useSettingsStore((state) => state.huggingfaceToken);
    const dataset = useSettingsStore((state) => state[datasetKey]);
    const hydrateSettings = useSettingsStore((state) => state.hydrate);

    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const hasAutoLoaded = useRef(false);

    useEffect(() => {
        hydrateSettings();
    }, [hydrateSettings]);

    const handleUrlSubmit = useCallback(
        async (input: string) => {
            let id = input;
            if (parseInput) {
                const parsed = parseInput(input);
                if (!parsed) {
                    toast.error(`Invalid URL or ID format.`);
                    return;
                }
                id = parsed;
            }

            // Update URL query param
            const params = new URLSearchParams(searchParams.toString());
            params.set(urlParam, id);
            router.replace(`?${params.toString()}`, { scroll: false });

            setIsLoading(true);
            record(recordEventName, id);

            try {
                // Use generic API for both ASL and Shamela
                // We construct the "file" param based on ID and assume .json.br
                const datasetId = dataset;
                const file = `${id}.json.br`;

                const response = await fetch(
                    `/api/huggingface?dataset=${encodeURIComponent(datasetId)}&file=${encodeURIComponent(file)}`,
                    { headers: { Authorization: `Bearer ${huggingfaceToken}` } },
                );

                if (!response.ok) {
                    let errorMessage = 'Failed to download data';
                    try {
                        const error = await response.json();
                        errorMessage = error.error || errorMessage;
                    } catch {
                        // Response was not JSON, use status text
                        errorMessage = response.statusText || errorMessage;
                    }
                    throw new Error(errorMessage);
                }

                const data = await readStreamedJson<T>(response);
                onDataLoaded(data, `${id}.json`);
                toast.success(`Downloaded ${id}`);
            } catch (error) {
                console.error('Failed to download:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to download');
            } finally {
                setIsLoading(false);
            }
        },
        [
            dataset,

            huggingfaceToken,
            onDataLoaded,
            parseInput,
            recordEventName,
            router,
            searchParams,
            urlParam,
        ],
    );

    // Auto-load from URL param
    useEffect(() => {
        const id = searchParams.get(urlParam);
        if (id && !hasAutoLoaded.current && huggingfaceToken && dataset) {
            hasAutoLoaded.current = true;
            setTimeout(() => handleUrlSubmit(id), 0);
        }
    }, [dataset, handleUrlSubmit, huggingfaceToken, searchParams, urlParam]);

    if (!huggingfaceToken || !dataset) {
        return null; // Or return a message asking to configure settings
    }

    return (
        <div className="space-y-2">
            <p className="font-medium text-gray-700 text-sm">{description}</p>
            <SubmittableInput
                className="w-full"
                disabled={isLoading}
                name="urlInput"
                onSubmit={handleUrlSubmit}
                placeholder={placeholder}
            />
            {isLoading && <p className="text-gray-500 text-sm">Downloading...</p>}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
            </div>
        </div>
    );
}
