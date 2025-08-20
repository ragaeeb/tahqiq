import { useRef } from 'react';

import { Button } from './ui/button';

interface JsonBrowseButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
    accept?: string;
    children: React.ReactNode;
    isMulti?: boolean;
    onFilesSelected: (files: FileList) => void;
}

export function JsonBrowseButton({
    accept = '.json',
    children,
    isMulti,
    onFilesSelected,
    ...props
}: JsonBrowseButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onFilesSelected(event.target.files);
        }
    };

    return (
        <>
            <Button onClick={() => fileInputRef.current?.click()} {...props}>
                {children}
            </Button>

            <input
                accept={accept}
                className="hidden"
                multiple={isMulti}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
            />
        </>
    );
}
