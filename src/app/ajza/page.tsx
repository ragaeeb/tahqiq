'use client';

import { DownloadIcon } from 'lucide-react';
import { record } from 'nanolytics';
import { useRouter } from 'next/navigation';

import '@/lib/analytics';
import { useEffect, useState } from 'react';
import { DataGate } from '@/components/data-gate';
import JsonDropZone from '@/components/json-drop-zone';
import { Button } from '@/components/ui/button';
import { LatestContractVersion } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';
import { loadFromOPFS } from '@/lib/io';
import type { Juz } from '@/stores/manuscriptStore/types';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type Ajza = { contractVersion: typeof LatestContractVersion.Ajza; data: AjzaData; type: 'ajza' };

type AjzaData = Record<string, Juz>;

/**
 * Displays a page to manage a group of Juz so that the manuscript page can be invoked with the right one.
 */
export default function AjzaPage() {
    const [fileNameToJuz, setFileNameToJuz] = useState<Record<string, Juz>>({});
    const initFromJuz = useManuscriptStore((state) => state.initFromJuz);
    const router = useRouter();

    useEffect(() => {
        loadFromOPFS('ajza').then((ajza) => {
            if (ajza) {
                record('RestoreAjzaFromSession');
                setFileNameToJuz(ajza as AjzaData);
            }
        });
    }, []);

    const hasData = Object.keys(fileNameToJuz).length > 0;

    return (
        <DataGate
            dropZone={
                <JsonDropZone
                    maxFiles={200}
                    onFiles={(fileNameToData) => {
                        const keys = Object.keys(fileNameToData);
                        const value = fileNameToData[keys[0]] as any;
                        record('LoadAjza', keys.length.toString());

                        if (keys.length === 1 && value.type === 'ajza') {
                            setFileNameToJuz((value as Ajza).data);
                        } else {
                            setFileNameToJuz((prev) => ({ ...prev, ...(fileNameToData as unknown as AjzaData) }));
                        }
                    }}
                />
            }
            hasData={hasData}
        >
            <div className="flex min-h-screen flex-col p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
                <div className="mx-auto flex w-full max-w-4xl flex-col">
                    <div className="mb-6 flex items-center gap-3">
                        <select
                            className="flex-1 rounded-md border bg-white p-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            onChange={(e) => {
                                record('SelectJuz', e.target.value);

                                initFromJuz(fileNameToJuz[e.target.value]);
                                router.push('/manuscript');

                                setTimeout(() => {
                                    document.title = e.target.value;
                                }, 1000); // need this hack since otherwise nextjs overwrites the title
                            }}
                        >
                            <option value="">Select a Juz...</option>
                            {Object.keys(fileNameToJuz).map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        <Button
                            onClick={() => {
                                const name = prompt('Enter output file name');

                                if (name) {
                                    record('DownloadAjza', name);

                                    const ajza = JSON.stringify({
                                        contractVersion: LatestContractVersion.Ajza,
                                        data: fileNameToJuz,
                                        type: 'ajza',
                                    } satisfies Ajza);

                                    downloadFile(name.endsWith('.json') ? name : `${name}.json`, ajza);
                                }
                            }}
                        >
                            <DownloadIcon />
                        </Button>
                    </div>

                    <JsonDropZone
                        maxFiles={200}
                        onFiles={(fileNameToData) => {
                            const keys = Object.keys(fileNameToData);
                            const value = fileNameToData[keys[0]] as any;
                            record('LoadAjza', keys.length.toString());

                            if (keys.length === 1 && value.type === 'ajza') {
                                setFileNameToJuz((value as Ajza).data);
                            } else {
                                setFileNameToJuz((prev) => ({ ...prev, ...(fileNameToData as unknown as AjzaData) }));
                            }
                        }}
                    />
                </div>
            </div>
        </DataGate>
    );
}
