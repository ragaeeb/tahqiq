'use client';

import type { ReactNode } from 'react';
import VersionFooter from '@/components/version-footer';

type DataGateProps = {
    /** Main content shown when data is loaded */
    children: ReactNode;
    /** DropZone component shown when no data */
    dropZone: ReactNode;
    /** Whether data has been loaded */
    hasData: boolean;
};

/**
 * Wrapper component that handles empty state vs data state rendering.
 * Shows a JsonDropZone when no data is loaded, otherwise renders children.
 * Includes VersionFooter in both states.
 */
export function DataGate({ children, dropZone, hasData }: DataGateProps) {
    if (!hasData) {
        return (
            <>
                <div className="flex min-h-screen flex-col p-8 font-[family-name:var(--font-geist-sans)] sm:p-20">
                    <div className="flex w-full max-w-4xl flex-col">{dropZone}</div>
                </div>
                <VersionFooter />
            </>
        );
    }

    return (
        <>
            {children}
            <VersionFooter />
        </>
    );
}
