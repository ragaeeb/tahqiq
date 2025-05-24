import { useRef } from 'react';

import { Button } from './ui/button';

type JsonBrowseButtonProps = {
    children: React.ReactNode;
    onFilesSelected: (files: FileList) => void;
};

export function JsonBrowseButton({ children, onFilesSelected }: JsonBrowseButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onFilesSelected(event.target.files);
        }
    };

    return (
        <>
            <Button
                //className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => fileInputRef.current?.click()}
            >
                {children}
            </Button>

            <input
                accept=".json"
                className="hidden"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
            />
        </>
    );
}
