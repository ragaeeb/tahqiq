import {
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface InputMenuProps extends Omit<React.ComponentProps<typeof Input>, 'onSubmit'> {
    label: string;
    onSubmit: (value: string) => void;
}

export const InputMenu = ({ label, onSubmit, ...props }: InputMenuProps) => {
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
                <DropdownMenuSubContent className="min-w-[200px] p-2">
                    <form onSubmit={handleSubmit}>
                        <Input
                            autoFocus
                            className="w-full px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                            name="input"
                            {...props}
                        />
                    </form>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
};
