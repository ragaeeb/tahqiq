'use client';

import { DownloadIcon } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TRANSLATION_MODELS } from '@/lib/constants';
import { downloadFile } from '@/lib/domUtils';

interface ValidationReportDialogProps {
    /** Pre-filled with the formatted validation errors */
    defaultErrors: string;
    /** Default filename for the report (without .json extension) */
    defaultFileName: string;
    /** Pre-selected model value */
    defaultModel: string;
    /** Pre-filled with the LLM response text from the textarea */
    defaultResponse: string;
    /** Callback to close the dialog */
    onClose: () => void;
}

/**
 * Dialog for creating a validation error report.
 * Captures context for debugging LLM translation issues.
 */
export function ValidationReportDialog({
    defaultErrors,
    defaultFileName,
    defaultModel,
    defaultResponse,
    onClose,
}: ValidationReportDialogProps) {
    const promptRef = useRef<HTMLTextAreaElement>(null);
    const responseRef = useRef<HTMLTextAreaElement>(null);
    const reasoningRef = useRef<HTMLTextAreaElement>(null);
    const notesRef = useRef<HTMLTextAreaElement>(null);
    const errorsRef = useRef<HTMLTextAreaElement>(null);
    const modelRef = useRef<string>(defaultModel);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const model = TRANSLATION_MODELS.find((m) => m.value === modelRef.current);
        const reportData = {
            errors: errorsRef.current?.value || defaultErrors,
            model: model?.label || 'Unknown',
            notes: notesRef.current?.value || '',
            prompt: promptRef.current?.value || '',
            reasoning: reasoningRef.current?.value || '',
            response: responseRef.current?.value || '',
            timestamp: new Date().toISOString(),
        };

        const fileName = `${defaultFileName}.json`;
        downloadFile(fileName, JSON.stringify(reportData, null, 2));
        onClose();
    };

    return (
        <DialogContent className="!max-w-[90vw] max-h-[90vh] w-[90vw] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Create Validation Report</DialogTitle>
                <DialogDescription>
                    Capture context for debugging this LLM translation issue. The report will be downloaded as a JSON
                    file.
                </DialogDescription>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label htmlFor="report-model">Model Used</Label>
                    <Select
                        defaultValue={defaultModel}
                        onValueChange={(value) => {
                            modelRef.current = value;
                        }}
                    >
                        <SelectTrigger id="report-model">
                            <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSLATION_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                    {model.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="report-prompt">Prompt Sent to LLM</Label>
                    <Textarea
                        className="h-[100px] resize-none font-mono text-sm"
                        id="report-prompt"
                        placeholder="Paste the prompt you sent to the LLM..."
                        ref={promptRef}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="report-response">LLM Response</Label>
                    <Textarea
                        className="h-[120px] resize-none font-mono text-sm"
                        defaultValue={defaultResponse}
                        id="report-response"
                        ref={responseRef}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="report-reasoning">LLM Reasoning Logs</Label>
                    <Textarea
                        className="h-[100px] resize-none font-mono text-sm"
                        id="report-reasoning"
                        placeholder="Paste reasoning/thinking logs from the LLM..."
                        ref={reasoningRef}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="report-errors">Validation Errors</Label>
                    <Textarea
                        className="h-[100px] resize-none font-mono text-xs"
                        defaultValue={defaultErrors}
                        id="report-errors"
                        ref={errorsRef}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="report-notes">Additional Notes</Label>
                    <Textarea
                        className="h-[80px] resize-none text-sm"
                        id="report-notes"
                        placeholder="Any additional context or observations..."
                        ref={notesRef}
                    />
                </div>

                <DialogFooter>
                    <Button onClick={onClose} type="button" variant="outline">
                        Cancel
                    </Button>
                    <Button type="submit">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
