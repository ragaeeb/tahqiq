import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@testing-library/jest-dom';
import { afterAll, afterEach, mock } from 'bun:test';

GlobalRegistrator.register();

const { cleanup } = await import('@testing-library/react');
const React = await import('react');

const registerGlobalMocks = () => {
    mock.module('@/components/ui/checkbox', () => {
        const Checkbox = ({ 'aria-label': ariaLabel, checked, id, onCheckedChange }: any) => {
            const [value, setValue] = React.useState(Boolean(checked));
            const shiftRef = React.useRef(false);

            React.useEffect(() => {
                setValue(Boolean(checked));
            }, [checked]);

            return React.createElement('input', {
                'aria-label': ariaLabel,
                checked: value,
                id,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    const next = event.target.checked;
                    setValue(next);
                    onCheckedChange?.(next, shiftRef.current);
                    shiftRef.current = false;
                },
                onClick: (event: React.MouseEvent<HTMLInputElement>) => {
                    shiftRef.current = event.shiftKey;
                },
                type: 'checkbox',
            });
        };

        return { Checkbox };
    });

    mock.module('@tanstack/react-virtual', () => ({
        useVirtualizer: ({ count }: { count: number }) => ({
            getScrollElement: () => null,
            getTotalSize: () => count * 60,
            getVirtualItems: () =>
                Array.from({ length: count }, (_, index) => ({
                    index,
                    key: `${index}`,
                    size: 60,
                    start: index * 60,
                })),
        }),
    }));
};

registerGlobalMocks();

const originalRestore = mock.restore.bind(mock);
mock.restore = () => {
    originalRestore();
    registerGlobalMocks();
};

afterAll(() => {
    GlobalRegistrator.unregister();
});

afterEach(() => {
    cleanup();
});
