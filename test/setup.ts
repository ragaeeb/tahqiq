import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@testing-library/jest-dom';
import { afterAll, afterEach, mock } from 'bun:test';

GlobalRegistrator.register();

const { cleanup } = await import('@testing-library/react');
const React = await import('react');

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

afterAll(() => {
    GlobalRegistrator.unregister();
});

afterEach(() => {
    cleanup();
});
