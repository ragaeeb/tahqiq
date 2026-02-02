import { expect, it } from 'bun:test';
import { segmentPages } from 'flappa-doormal';
import type { Compilation } from '@/stores/excerptsStore/types';

it.skip('should migrate', async () => {
    const data: Compilation = await Bun.file('excerpts.json').json();
    const pages = data.excerpts.map((e, i) => ({ content: e.nass, id: i }));

    const segments = segmentPages(pages, {
        maxPages: 0,
        rules: [
            {
                lineStartsAfter: [
                    '{{raqms:num}}\\s?{{dash}}',
                    '{{raqms:num}}/ {{raqms}}\\s?{{dash}}',
                    '({{raqms:num}}) ',
                ],
            },
        ],
    });

    for (let i = 0; i < segments.length; i++) {
        const s = segments[i];

        if (!data.excerpts[i].nass.includes(s.content)) {
            console.log('Mismatch at', i, 'Original', data.excerpts[i], 'new', s);
            break;
        }

        data.excerpts[i].nass = s.content;

        if (s.meta) {
            data.excerpts[i].meta = s.meta;
        }
    }

    await Bun.write('output.json', JSON.stringify(data, null, 2));

    expect(segments.length).toBe(data.excerpts.length);
});
