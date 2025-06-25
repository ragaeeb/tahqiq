import { create } from 'zustand';

export type FormatterFunction = (text: string) => string;

export type TextAreaElement = HTMLInputElement | HTMLTextAreaElement;

export type ToolbarAction = {
    formatter: FormatterFunction;
    id: string;
    label: string;
};

export type ToolbarState = {
    activeElement: null | TextAreaElement;
    isVisible: boolean;
    position: null | { x: number; y: number };
};

type ToolbarStore = {
    cancelScheduledHide: () => void;
    clearToolbar: () => void;
    scheduleHide: () => void;
    setActiveElement: (element: null | TextAreaElement) => void;
    setToolbarVisible: (visible: boolean, element?: TextAreaElement) => void;
    toolbarState: ToolbarState;
};

let hideTimeout: NodeJS.Timeout | null = null;

export const useToolbarStore = create<ToolbarStore>((set, get) => ({
    cancelScheduledHide: () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    },

    clearToolbar: () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        set({
            toolbarState: {
                activeElement: null,
                isVisible: false,
                position: null,
            },
        });
    },

    scheduleHide: () => {
        // Cancel any existing timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }

        // Schedule new hide
        hideTimeout = setTimeout(() => {
            get().clearToolbar();
        }, 500);
    },

    setActiveElement: (element: null | TextAreaElement) =>
        set((state) => ({
            toolbarState: {
                ...state.toolbarState,
                activeElement: element,
            },
        })),

    setToolbarVisible: (visible: boolean, element?: TextAreaElement) => {
        // Cancel any pending hide when showing toolbar
        if (visible && hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        set((state) => ({
            toolbarState: {
                ...state.toolbarState,
                activeElement: element || state.toolbarState.activeElement,
                isVisible: visible,
                position: element
                    ? {
                          x: element.getBoundingClientRect().left,
                          y: element.getBoundingClientRect().bottom + 5,
                      }
                    : state.toolbarState.position,
            },
        }));
    },

    toolbarState: {
        activeElement: null,
        isVisible: false,
        position: null,
    },
}));
