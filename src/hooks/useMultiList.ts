import { useState, useEffect, useCallback } from 'react';
import { compressListPayload, decompressListPayload } from '../utils/compression';
import type { ShoppingListPayload } from '../utils/compression';

const STORAGE_KEY = 'arcmart-lists';
const ACTIVE_LIST_KEY = 'arcmart-active-list';

export interface ShoppingListItem {
    itemId: number;
    quantity: number;
    checked: boolean;
    phase?: number;
}

export interface ShoppingListCategory {
    id: string;
    name: string;
    phase: number;
}

export interface ShoppingList {
    id: string;
    name: string;
    items: ShoppingListItem[];
    categories: ShoppingListCategory[];
    createdAt: number;
    updatedAt: number;
}

// Preset types
export interface PresetItem {
    id: number;
    quantity: number;
    phase: number;
}

export interface Preset {
    name: string;
    description: string;
    items: PresetItem[];
}

export interface PresetFile {
    filename: string;
    name: string;
    description: string;
    category?: string;
}

const generateId = () => `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateCategoryId = () => `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_CATEGORIES: ShoppingListCategory[] = [
    { id: generateCategoryId(), name: 'Phase 1', phase: 1 },
    { id: generateCategoryId(), name: 'Phase 2', phase: 2 },
    { id: generateCategoryId(), name: 'Phase 3', phase: 3 },
    { id: generateCategoryId(), name: 'Phase 4', phase: 4 },
];

const createEmptyList = (name: string = "New List", withCategories: boolean = false): ShoppingList => ({
    id: generateId(),
    name,
    items: [],
    categories: withCategories ? DEFAULT_CATEGORIES.map(c => ({ ...c, id: generateCategoryId() })) : [],
    createdAt: Date.now(),
    updatedAt: Date.now()
});

export const useMultiList = () => {
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [importedListId, setImportedListId] = useState<string | null>(null);
    
    // Pending import when a duplicate name is found
    const [pendingImport, setPendingImport] = useState<{
        name: string;
        items: ShoppingListItem[];
        categories: ShoppingListCategory[];
        existingListId: string;
    } | null>(null);

    // Load from localStorage and URL on mount
    useEffect(() => {
        let loadedLists: ShoppingList[] = [];
        let loadedActiveId: string | null = null;

        // Load existing lists from localStorage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                loadedLists = JSON.parse(stored);
                // Migrate old lists without categories property
                loadedLists = loadedLists.map(list => ({
                    ...list,
                    categories: list.categories || []
                }));
            }
            const storedActiveId = localStorage.getItem(ACTIVE_LIST_KEY);
            if (storedActiveId) {
                loadedActiveId = storedActiveId;
            }
        } catch (e) {
            console.error("Failed to load lists from localStorage:", e);
        }

        // Check URL hash for shared list
        const hash = window.location.hash.replace('#d=', '');
        if (hash && hash.length > 0) {
            const payload = decompressListPayload(hash);
            if (payload) {
                const importName = payload.n || "Imported List";
                
                // Parse categories from payload (v2+)
                const importCategories: ShoppingListCategory[] = payload.c 
                    ? payload.c.map((cat) => ({
                        id: cat.id || generateCategoryId(),
                        name: cat.name,
                        phase: cat.phase
                    }))
                    : [];
                
                // Parse items with phase assignments and checked status
                const checkedSet = new Set(payload.k || []);
                const importItems = Object.entries(payload.i).map(([itemId, quantity]) => ({
                    itemId: Number(itemId),
                    quantity,
                    checked: checkedSet.has(Number(itemId)),
                    phase: payload.p?.[Number(itemId)]
                }));
                
                // Check if a list with the same name already exists
                const existingList = loadedLists.find(
                    list => list.name.toLowerCase() === importName.toLowerCase()
                );
                
                if (existingList) {
                    // Store pending import for user decision
                    setPendingImport({
                        name: importName,
                        items: importItems,
                        categories: importCategories,
                        existingListId: existingList.id
                    });
                    // Don't clear URL yet - will clear after user decision
                } else {
                    // No duplicate, import directly
                    const importedList: ShoppingList = {
                        id: generateId(),
                        name: importName,
                        items: importItems,
                        categories: importCategories,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    
                    // Add to lists
                    loadedLists = [...loadedLists, importedList];
                    loadedActiveId = importedList.id;
                    
                    // Save to localStorage IMMEDIATELY so it persists across StrictMode double-runs
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedLists));
                    localStorage.setItem(ACTIVE_LIST_KEY, loadedActiveId);
                    
                    setImportedListId(importedList.id);
                    
                    // Clear the URL hash
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
        }

        // If no lists exist, create a default one
        if (loadedLists.length === 0) {
            const defaultList = createEmptyList("My Loadout");
            loadedLists = [defaultList];
            loadedActiveId = defaultList.id;
        }

        // Validate active list ID
        if (!loadedActiveId || !loadedLists.find(l => l.id === loadedActiveId)) {
            loadedActiveId = loadedLists[0]?.id || null;
        }

        setLists(loadedLists);
        setActiveListId(loadedActiveId);
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever lists change
    useEffect(() => {
        if (!isLoaded) return;
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
            if (activeListId) {
                localStorage.setItem(ACTIVE_LIST_KEY, activeListId);
            }
        } catch (e) {
            console.error("Failed to save to localStorage:", e);
        }
    }, [lists, activeListId, isLoaded]);

    // Get active list
    const activeList = lists.find(l => l.id === activeListId) || null;

    // Create new list
    const createList = useCallback((name: string = "New List") => {
        const newList = createEmptyList(name);
        setLists(prev => [...prev, newList]);
        setActiveListId(newList.id);
        return newList.id;
    }, []);

    // Create new list with items already added
    const createListWithItems = useCallback((name: string, items: Array<{ itemId: number; quantity: number }>) => {
        const newList: ShoppingList = {
            id: generateId(),
            name,
            items: items.map(item => ({
                itemId: item.itemId,
                quantity: item.quantity,
                checked: false
            })),
            categories: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setLists(prev => [...prev, newList]);
        setActiveListId(newList.id);
        return newList.id;
    }, []);

    // Delete list
    const deleteList = useCallback((listId: string) => {
        setLists(prev => {
            const filtered = prev.filter(l => l.id !== listId);
            // If we deleted the active list, switch to another
            if (listId === activeListId && filtered.length > 0) {
                setActiveListId(filtered[0].id);
            } else if (filtered.length === 0) {
                // Create a new default list if all are deleted
                const newList = createEmptyList("My Loadout");
                setActiveListId(newList.id);
                return [newList];
            }
            return filtered;
        });
    }, [activeListId]);

    // Update list name
    const updateListName = useCallback((listId: string, name: string) => {
        setLists(prev => prev.map(list => 
            list.id === listId 
                ? { ...list, name, updatedAt: Date.now() } 
                : list
        ));
    }, []);

    // Update item quantity in active list
    const updateQuantity = useCallback((itemId: number, quantity: number, phase?: number) => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            let newItems = [...list.items];
            
            if (quantity <= 0) {
                newItems = newItems.filter(item => item.itemId !== itemId);
            } else {
                const existing = newItems.find(item => item.itemId === itemId);
                if (existing) {
                    newItems = newItems.map(item => 
                        item.itemId === itemId ? { ...item, quantity } : item
                    );
                } else {
                    // For new items, default to first category's phase or undefined
                    const defaultPhase = phase ?? (list.categories.length > 0 ? undefined : undefined);
                    newItems.push({ itemId, quantity, checked: false, phase: defaultPhase });
                }
            }
            
            return { ...list, items: newItems, updatedAt: Date.now() };
        }));
    }, [activeListId]);

    // Toggle check in active list
    const toggleCheck = useCallback((itemId: number) => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            return {
                ...list,
                items: list.items.map(item =>
                    item.itemId === itemId ? { ...item, checked: !item.checked } : item
                ),
                updatedAt: Date.now()
            };
        }));
    }, [activeListId]);

    // Clear checked items in active list
    const clearChecked = useCallback(() => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            return {
                ...list,
                items: list.items.filter(item => !item.checked),
                updatedAt: Date.now()
            };
        }));
    }, [activeListId]);

    // Generate share link for a specific list
    const getShareLink = useCallback((listId?: string) => {
        const targetList = listId 
            ? lists.find(l => l.id === listId) 
            : activeList;
            
        if (!targetList) return '';
        
        // Build item quantities, phase mappings, and checked items
        const itemQuantities: Record<number, number> = {};
        const itemPhases: Record<number, number> = {};
        const checkedItems: number[] = [];
        
        targetList.items.forEach(item => {
            if (item.quantity > 0) {
                itemQuantities[item.itemId] = item.quantity;
                if (item.phase !== undefined) {
                    itemPhases[item.itemId] = item.phase;
                }
                if (item.checked) {
                    checkedItems.push(item.itemId);
                }
            }
        });
        
        // Build categories list with phase numbers (only if there are categories)
        const categories = targetList.categories.length > 0
            ? targetList.categories.map(cat => ({ 
                id: cat.id, 
                name: cat.name,
                phase: cat.phase 
            }))
            : undefined;
        
        const payload: ShoppingListPayload = {
            v: 3, // Updated version to indicate checked items support
            n: targetList.name,
            i: itemQuantities,
            c: categories,
            p: Object.keys(itemPhases).length > 0 ? itemPhases : undefined,
            k: checkedItems.length > 0 ? checkedItems : undefined
        };
        
        const compressed = compressListPayload(payload);
        return `${window.location.origin}${window.location.pathname}#d=${compressed}`;
    }, [lists, activeList]);

    // Dismiss imported notification
    const dismissImportNotice = useCallback(() => {
        setImportedListId(null);
    }, []);

    // Handle pending import: overwrite existing list
    const confirmImportOverwrite = useCallback(() => {
        if (!pendingImport) return;
        
        setLists(prev => prev.map(list => {
            if (list.id === pendingImport.existingListId) {
                return {
                    ...list,
                    items: pendingImport.items,
                    categories: pendingImport.categories,
                    updatedAt: Date.now()
                };
            }
            return list;
        }));
        
        setActiveListId(pendingImport.existingListId);
        setImportedListId(pendingImport.existingListId);
        setPendingImport(null);
        window.history.replaceState(null, '', window.location.pathname);
    }, [pendingImport]);

    // Handle pending import: create as new list
    const confirmImportAsNew = useCallback(() => {
        if (!pendingImport) return;
        
        // Generate a unique name by appending a number
        let newName = pendingImport.name;
        let counter = 2;
        const existingNames = lists.map(l => l.name.toLowerCase());
        
        while (existingNames.includes(newName.toLowerCase())) {
            newName = `${pendingImport.name} (${counter})`;
            counter++;
        }
        
        const importedList: ShoppingList = {
            id: generateId(),
            name: newName,
            items: pendingImport.items,
            categories: pendingImport.categories,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        setLists(prev => [...prev, importedList]);
        setActiveListId(importedList.id);
        setImportedListId(importedList.id);
        setPendingImport(null);
        window.history.replaceState(null, '', window.location.pathname);
    }, [pendingImport, lists]);

    // Cancel pending import
    const cancelPendingImport = useCallback(() => {
        setPendingImport(null);
        window.history.replaceState(null, '', window.location.pathname);
    }, []);

    // Add a category to active list
    const addCategory = useCallback((name: string, phase?: number) => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            const maxPhase = Math.max(0, ...list.categories.map(c => c.phase));
            const newCategory: ShoppingListCategory = {
                id: generateCategoryId(),
                name,
                phase: phase ?? maxPhase + 1
            };
            
            return {
                ...list,
                categories: [...list.categories, newCategory],
                updatedAt: Date.now()
            };
        }));
    }, [activeListId]);

    // Rename a category
    const renameCategory = useCallback((categoryId: string, name: string) => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            return {
                ...list,
                categories: list.categories.map(cat =>
                    cat.id === categoryId ? { ...cat, name } : cat
                ),
                updatedAt: Date.now()
            };
        }));
    }, [activeListId]);

    // Delete a category (items in it become uncategorized/phase 0)
    const deleteCategory = useCallback((categoryId: string) => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            const category = list.categories.find(c => c.id === categoryId);
            if (!category) return list;
            
            return {
                ...list,
                categories: list.categories.filter(c => c.id !== categoryId),
                items: list.items.map(item =>
                    item.phase === category.phase ? { ...item, phase: undefined } : item
                ),
                updatedAt: Date.now()
            };
        }));
    }, [activeListId]);

    // Move an item to a different phase/category
    const moveItemToPhase = useCallback((itemId: number, phase: number | undefined) => {
        if (!activeListId) return;
        
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            
            return {
                ...list,
                items: list.items.map(item =>
                    item.itemId === itemId ? { ...item, phase } : item
                ),
                updatedAt: Date.now()
            };
        }));
    }, [activeListId]);

    // Import a preset as a new list
    // Helper function to create a list from preset data
    const createListFromPreset = useCallback((preset: Preset): string => {
        // Get unique phases and create categories
        const phases = [...new Set(preset.items.map(item => item.phase))].sort((a, b) => a - b);
        const categories: ShoppingListCategory[] = phases.map(phase => ({
            id: generateCategoryId(),
            name: `Phase ${phase}`,
            phase
        }));
        
        // Create items with phases
        const items: ShoppingListItem[] = preset.items.map(item => ({
            itemId: item.id,
            quantity: item.quantity,
            checked: false,
            phase: item.phase
        }));
        
        const newList: ShoppingList = {
            id: generateId(),
            name: preset.name,
            items,
            categories,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        setLists(prev => [...prev, newList]);
        setActiveListId(newList.id);
        setImportedListId(newList.id);
        
        return newList.id;
    }, []);

    // Import preset from server (by filename)
    const importPreset = useCallback(async (presetFilename: string) => {
        try {
            const response = await fetch(`/data/presets/${presetFilename}`);
            if (!response.ok) throw new Error('Failed to load preset');
            
            const preset: Preset = await response.json();
            return createListFromPreset(preset);
        } catch (error) {
            console.error('Failed to import preset:', error);
            return null;
        }
    }, [createListFromPreset]);

    // Import preset from raw data (for file uploads)
    const importPresetFromData = useCallback((data: Preset): string | null => {
        try {
            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Invalid preset format');
            }
            return createListFromPreset(data);
        } catch (error) {
            console.error('Failed to import preset data:', error);
            return null;
        }
    }, [createListFromPreset]);

    return {
        lists,
        activeList,
        activeListId,
        setActiveListId,
        createList,
        createListWithItems,
        deleteList,
        updateListName,
        updateQuantity,
        toggleCheck,
        clearChecked,
        getShareLink,
        isLoaded,
        importedListId,
        dismissImportNotice,
        // Category management
        addCategory,
        renameCategory,
        deleteCategory,
        moveItemToPhase,
        // Preset import
        importPreset,
        importPresetFromData,
        // Pending import handling (duplicate names)
        pendingImport,
        confirmImportOverwrite,
        confirmImportAsNew,
        cancelPendingImport
    };
};


