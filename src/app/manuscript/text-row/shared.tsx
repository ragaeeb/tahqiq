import React from 'react';

import { Button } from '@/components/ui/button';

export const ActionButton = (props: any) => {
    return (
        <Button
            className="flex items-center justify-center px-2 w-4 h-4 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            variant="ghost"
            {...props}
        />
    );
};
