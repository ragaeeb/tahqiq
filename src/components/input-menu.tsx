import {
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export const InputMenu = ({
    label,
    onSubmit,
    placeholder,
}: {
    label: string;
    onSubmit: (value: string) => void;
    placeholder: string;
}) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const value = formData.get('input') as string;

        if (value.trim()) {
            onSubmit(value.trim());
        }
    };

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-2 min-w-[200px]">
                    <form onSubmit={handleSubmit}>
                        <Input
                            autoFocus
                            className="w-full text-sm px-2 py-1.5 focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
                            name="input"
                            placeholder={placeholder}
                        />
                    </form>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
};
