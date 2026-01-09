/** Flattens and normalizes a type’s shape for readability */
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
