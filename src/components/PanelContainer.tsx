'use client';

import { type ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type PanelContainerProps = { children: ReactNode; onCloseClicked: () => void; title?: string };

/**
 * Container component for a left-side slide-in panel
 */
export const PanelContainer = ({ children, onCloseClicked, title = 'Segment Pages' }: PanelContainerProps) => {
    useEffect(() => {
        // Scope scroll-lock overrides to this panel only.
        document.body.setAttribute('data-segpanel-open', '1');
        return () => document.body.removeAttribute('data-segpanel-open');
    }, []);

    return (
        <Dialog modal={false} open>
            <DialogContent className="!max-w-none !w-[60vw] fixed top-0 right-auto left-0 flex h-full translate-x-0 translate-y-0 flex-col rounded-none border-t-0 border-r border-b-0 border-l-0 p-0 [&>button]:hidden">
                <DialogHeader className="flex flex-shrink-0 flex-row items-center justify-between border-b bg-gray-50 px-4 py-2">
                    <DialogTitle className="text-left">{title}</DialogTitle>
                    <DialogClose asChild>
                        <Button onClick={onCloseClicked} size="sm" variant="ghost">
                            Close
                        </Button>
                    </DialogClose>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
};
