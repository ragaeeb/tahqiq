import { FormattingToolbar } from 'blumbaben';
import { record } from 'nanolytics';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

function RowToolbar() {
    const quickSubs = useSettingsStore((state) => state.quickSubs);

    return (
        <FormattingToolbar>
            {(applyFormat) => {
                const onSubClicked = (e: any) => {
                    const subId = e.target.getAttribute('data-id');
                    record('QuickSub', subId);
                    applyFormat(() => subId);
                };

                return (
                    <>
                        {quickSubs.map((q) => (
                            <Button
                                data-id={q}
                                key={`quick-sub-${q}`}
                                onClick={onSubClicked}
                                size="sm"
                                variant="outline"
                            >
                                {q}
                            </Button>
                        ))}
                    </>
                );
            }}
        </FormattingToolbar>
    );
}

export default React.memo(RowToolbar);
