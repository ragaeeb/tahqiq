import type React from 'react';

import { Input } from '@/components/ui/input';

interface SubmittableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'onSubmit'> {
    name: string;
    trim?: boolean;
    onSubmit: (value: string) => void;
}

const SubmittableInput: React.FC<SubmittableInputProps> = ({ name, onSubmit, trim = true, ...rest }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const value = (data.get(name) as string) || '';
        onSubmit(trim ? value.trim() : value);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input name={name} {...rest} />
        </form>
    );
};

export default SubmittableInput;
