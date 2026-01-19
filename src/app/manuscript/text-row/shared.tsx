import { Button } from '@/components/ui/button';

export const ActionButton = (props: any) => {
    return (
        <Button
            className="flex h-4 w-4 items-center justify-center rounded-full px-2 transition-colors duration-150 hover:bg-green-200 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            variant="ghost"
            {...props}
        />
    );
};
