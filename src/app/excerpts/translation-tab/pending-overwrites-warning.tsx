'use client';

interface PendingOverwritesWarningProps {
    duplicates: string[];
    overwrites: string[];
}

export function PendingOverwritesWarning({ duplicates, overwrites }: PendingOverwritesWarningProps) {
    return (
        <div className="space-y-2">
            {duplicates.length > 0 && (
                <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800 text-sm">
                    <div className="font-medium">
                        ⚠️ Duplicate IDs in pasted text (later entries will override earlier ones):
                    </div>
                    <div className="mt-1 max-h-16 overflow-y-auto font-mono text-xs">{duplicates.join(', ')}</div>
                </div>
            )}
            {overwrites.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
                    <div className="font-medium">
                        ⚠️ {overwrites.length} excerpt(s) already have translations that will be overwritten:
                    </div>
                    <div className="mt-1 max-h-16 overflow-y-auto font-mono text-xs">{overwrites.join(', ')}</div>
                </div>
            )}
        </div>
    );
}
