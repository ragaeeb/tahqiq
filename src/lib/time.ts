export const timeToSeconds = (str: string) => {
    const parts = str.split(':').map((p) => parseInt(p, 10));

    if (parts.length === 3) {
        return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
    }

    if (parts.length === 2) {
        return parts[0]! * 60 + parts[1]!;
    }
    return parseInt(str, 10) || 0;
};
