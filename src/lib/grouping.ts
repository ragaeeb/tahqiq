export const getNeighbors = (list: any[]) => {
    const map: Record<string, { prev?: string; next?: string }> = {};
    for (let i = 0; i < list.length; i++) {
        map[list[i].id] = {
            next: i < list.length - 1 ? list[i + 1].id : undefined,
            prev: i > 0 ? list[i - 1].id : undefined,
        };
    }
    return map;
};
