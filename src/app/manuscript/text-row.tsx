import type { SheetLine } from '@/stores/manuscriptStore/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useManuscriptStore } from '@/stores/manuscriptStore/useManuscriptStore';

type TextRowProps = {
    data: SheetLine;
};

export default function TextRow({ data }: TextRowProps) {
    const splitAltAtLineBreak = useManuscriptStore((state) => state.splitAltAtLineBreak);
    const mergeWithAbove = useManuscriptStore((state) => state.mergeWithAbove);

    return (
        <tr className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
            <td
                aria-label="Page"
                className={`w-20 px-4 py-4 text-left text-sm font-medium text-gray-900 border-r border-gray-100 ${data.hasInvalidFootnotes && 'bg-red-200'}`}
            >
                {data.page}
            </td>
            <td
                aria-label="Text"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed text-gray-800 border-r border-gray-100 ${data.isMerged && 'bg-red-300'}`}
                dir="rtl"
            >
                <Input
                    className={`w-full !text-xl text-right leading-relaxed text-gray-800 ${data.includesHonorifics ? 'bg-red-200' : 'bg-transparent'} border-none outline-none focus:bg-gray-50 focus:rounded px-1 py-1 transition-colors duration-150`}
                    defaultValue={data.text}
                    dir="rtl"
                    style={{ fontFamily: 'inherit' }}
                    type="text"
                />
            </td>
            <td
                aria-label="Support"
                className={`w-1/2 px-4 py-4 text-xl text-right leading-relaxed ${
                    data.alt && data.isSimilar ? 'text-gray-800 bg-green-50' : 'text-red-600 bg-red-50'
                } transition-colors duration-150`}
                dir="rtl"
            >
                <div className="flex items-center justify-between">
                    <Button
                        aria-label="Mark as supported"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                        ✓
                    </Button>
                    <Button
                        aria-label="Merge With Above"
                        className="flex items-center justify-center px-2 w-8 h-8 rounded-full hover:bg-green-200 hover:text-green-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        onClick={() => {
                            mergeWithAbove(data.page, data.id);
                        }}
                        variant="outline"
                    >
                        ↑
                    </Button>
                    <Textarea
                        className="text-right flex-1 mr-2 !text-xl leading-relaxed bg-transparent border-none outline-none focus:bg-white focus:rounded resize-none overflow-hidden min-h-[1.5em] px-1 py-1 transition-colors duration-150"
                        dir="rtl"
                        onChange={(e) => {
                            if (e.target.value !== data.alt) {
                                splitAltAtLineBreak(data.page, data.id, e.target.value);
                            }
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                        }}
                        placeholder="✗"
                        rows={1}
                        style={{ fontFamily: 'inherit' }}
                        value={data.alt || ''}
                    />
                </div>
            </td>
        </tr>
    );
}
