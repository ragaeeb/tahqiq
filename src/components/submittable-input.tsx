import React from 'react';

import { Input } from '@/components/ui/input';

interface SubmittableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'onSubmit'> {
    name: string;
    onSubmit: (value: string) => void;
}

const SubmittableInput: React.FC<SubmittableInputProps> = ({ name, onSubmit, ...rest }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const value = (data.get(name) as string)?.trim() || '';
        onSubmit(value);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input name={name} {...rest} />
        </form>
    );
};

export default SubmittableInput;
