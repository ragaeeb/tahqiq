import { replaceLineBreaksWithSpaces } from 'bitaboom';
import { FormattingToolbar } from 'blumbaben';
import { record } from 'nanolytics';
import React from 'react';

import { Button } from '@/components/ui/button';
import { fixUnbalanced, preformatArabicText } from '@/lib/textUtils';
import { useSettingsStore } from '@/stores/settingsStore/useSettingsStore';

function PageToolbar() {
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
                        <Button
                            key="replaceLineBreaksWithSpaces"
                            onClick={() => {
                                record('FormatToolBar', 'lineBreaksToSpaces');
                                applyFormat(replaceLineBreaksWithSpaces);
                            }}
                            size="sm"
                            variant="outline"
                        >
                            ↩̶
                        </Button>
                        <Button
                            key="reformat"
                            onClick={() => {
                                record('Reformat');
                                applyFormat(preformatArabicText);
                            }}
                            size="sm"
                        >
                            Reformat
                        </Button>
                        <Button
                            key="fixUnbalanced"
                            onClick={() => {
                                record('FixUnbalanced');
                                applyFormat(fixUnbalanced);
                            }}
                            size="sm"
                        >
                            «»
                        </Button>
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

export default React.memo(PageToolbar);
