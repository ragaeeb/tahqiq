/**
 * Represents a single patch for a page field change
 */
export type PagePatch = {
    /** Page ID this patch applies to */
    pageId: number;
    /** Field that was modified */
    field: 'body' | 'footnote';
    /** Serialized diff patch (from patchToText) */
    diff: string;
    /** Timestamp when the patch was created */
    createdAt: number;
};

/**
 * Collection of patches for a book
 */
export type BookPatches = {
    /** Optional Shamela book ID */
    bookId?: number;
    /** All tracked patches */
    patches: PagePatch[];
};

/**
 * Patch store state
 */
export type PatchStoreState = {
    /** Current book's patches */
    patches: PagePatch[];
    /** Book ID these patches are for */
    bookId?: number;
};

/**
 * Patch store actions
 */
export type PatchStoreActions = {
    /** Add a new patch */
    addPatch: (patch: Omit<PagePatch, 'createdAt'>) => void;
    /** Clear all patches */
    clearPatches: () => void;
    /** Set the book ID for context */
    setBookId: (bookId?: number) => void;
    /** Export patches as serializable object */
    exportPatches: () => BookPatches;
    /** Import patches from serialized object */
    importPatches: (data: BookPatches) => void;
};

/**
 * Complete patch store type
 */
export type PatchStore = PatchStoreState & PatchStoreActions;
