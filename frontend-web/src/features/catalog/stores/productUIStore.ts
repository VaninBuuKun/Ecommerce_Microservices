import { create } from "zustand";

interface ProductUIState {
	expandedRows: Record<string, boolean>;
	toggleExpandRow: (id: string) => void;
	clearExpandedRows: () => void;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	cursorHistory: (string | null)[];
	setCursorHistory: (history: (string | null)[]) => void;
	currentCursorIndex: number;
	setCurrentCursorIndex: (index: number) => void;
}

export const useProductUIStore = create<ProductUIState>((set) => ({
	expandedRows: {},
	toggleExpandRow: (id) =>
		set((state) => ({
			expandedRows: {
				...state.expandedRows,
				[id]: !state.expandedRows[id],
			},
		})),
	clearExpandedRows: () => set({ expandedRows: {} }),
	searchTerm: "",
	setSearchTerm: (term) => set({ searchTerm: term }),
	cursorHistory: [null],
	setCursorHistory: (history) => set({ cursorHistory: history }),
	currentCursorIndex: 0,
	setCurrentCursorIndex: (index) => set({ currentCursorIndex: index }),
}));
export default useProductUIStore;
