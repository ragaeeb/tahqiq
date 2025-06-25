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
    clearToolbar: () => void;
    setActiveElement: (element: null | TextAreaElement) => void;
    setToolbarVisible: (visible: boolean, element?: TextAreaElement) => void;
    toolbarState: ToolbarState;
};

export const useToolbarStore = create<ToolbarStore>((set) => ({
    clearToolbar: () =>
        set({
            toolbarState: {
                activeElement: null,
                isVisible: false,
                position: null,
            },
        }),

    setActiveElement: (element: null | TextAreaElement) =>
        set((state) => ({
            toolbarState: {
                ...state.toolbarState,
                activeElement: element,
            },
        })),

    setToolbarVisible: (visible: boolean, element?: TextAreaElement) =>
        set((state) => ({
            toolbarState: {
                ...state.toolbarState,
                activeElement: element || state.toolbarState.activeElement,
                isVisible: visible,
                position: element
                    ? {
                          x: element.getBoundingClientRect().right + 10,
                          y: element.getBoundingClientRect().top,
                      }
                    : state.toolbarState.position,
            },
        })),

    toolbarState: {
        activeElement: null,
        isVisible: false,
        position: null,
    },
}));
