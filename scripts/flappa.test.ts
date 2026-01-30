it.skip('should migrate', async () => {
    const data = await Bun.file('excerpts.json').json();
    initPages(data.excerpts.map((e) => e.nass));

    const segments = segmentPages(pages, {
        maxPages: 0, // Guarantees 1:1 mapping
        rules: [
            {
                lineStartsAfter: [
                    '{{raqms:num}} {{dash}} {{raqms:num2}} {{dash}} {{raqms:num3}} ',
                    '{{raqms:num}} {{dash}} {{raqms:num2}} {{dash}} ',
                    '{{raqms:num}} ({{harf}}) {{dash}} ',
                    '{{raqms:num}} «{{harf}}» {{dash}}',
                    '{{raqms:num}} ({{harf}}) ',
                    '{{raqms:num}} {{dash}}',
                ],
            },
            { fuzzy: true, lineStartsWith: ['{{bab}} ', '{{bab}}:'], meta: { type: 'C' } },
            { fuzzy: true, lineStartsWith: ['{{kitab}} '], meta: { type: 'B' } },
        ],
    });

    for (let i = 0; i < segments.length; i++) {
        const s = segments[i];

        if (!data.excerpts[i].nass.includes(s.content)) {
            console.log('Check', s);
            console.log('vs.', data.excerpts[i]);
            break;
        }
    }

    expect(segments.length).toBe(data.excerpts.length);

    segments.forEach((s, i) => {
        data.excerpts[i].nass = s.content;

        if (s.meta) {
            data.excerpts[i].meta = s.meta;
        }
    });

    const headings = [];

    data.headings.forEach(({ parent, ...h }) => {
        headings.push(h);
    });

    await Bun.write('output.json', JSON.stringify({ ...data, headings }, null, 2));
});
