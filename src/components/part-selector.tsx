'use client';

import React from 'react';

type Props = {
    onChange: (part: string) => void;
    parts: string[];
    selected: string;
};

export default function PartSelector({ onChange, parts, selected }: Props) {
    return (
        <select className="p-2 border rounded" onChange={(e) => onChange(e.target.value)} value={selected}>
            {parts.map((p) => (
                <option key={p} value={p}>
                    Part {p}
                </option>
            ))}
        </select>
    );
}
