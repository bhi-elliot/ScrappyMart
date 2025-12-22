import { useState, useEffect, useCallback } from 'react';
import { compressListPayload, decompressListPayload } from '../utils/compression';
import type { ShoppingListPayload } from '../utils/compression';

const STORAGE_KEY = 'arcmart-shopping-list';

export interface ShoppingListItem {
    itemId: number;
    quantity: number;
    checked: boolean;
}

interface StoredList {
    name: string;
    items: ShoppingListItem[];
}

export const useShoppingList = () => {
    const [listName, setListName] = useState("My Run");
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadedFromUrl, setLoadedFromUrl] = useState(false);

    // Load from URL hash or localStorage on mount
    useEffect(() => {
        const hash = window.location.hash.replace('#d=', '');
        
        if (hash && hash.length > 0) {
            // Load from URL if hash exists
            const payload = decompressListPayload(hash);
            if (payload) {
                setListName(payload.n);
                const loadedItems = Object.entries(payload.i).map(([itemId, quantity]) => ({
                    itemId: Number(itemId),
                    quantity,
                    checked: false
                }));
                setItems(loadedItems);
                setLoadedFromUrl(true);
            }
        } else {
            // Load from localStorage
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const data: StoredList = JSON.parse(stored);
                    setListName(data.name || "My Run");
                    setItems(data.items || []);
                }
            } catch (e) {
                console.error("Failed to load from localStorage:", e);
            }
        }
        
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever list changes (but not on initial load)
    useEffect(() => {
        if (!isLoaded) return;
        
        const data: StoredList = {
            name: listName,
            items: items
        };
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save to localStorage:", e);
        }
    }, [listName, items, isLoaded]);

    // Update Item Quantity
    const updateQuantity = useCallback((itemId: number, quantity: number) => {
        setItems(prev => {
            if (quantity <= 0) {
                return prev.filter(item => item.itemId !== itemId);
            }
            const existing = prev.find(item => item.itemId === itemId);
            if (existing) {
                return prev.map(item => item.itemId === itemId ? { ...item, quantity } : item);
            }
            return [...prev, { itemId, quantity, checked: false }];
        });
    }, []);

    // Toggle Check
    const toggleCheck = useCallback((itemId: number) => {
        setItems(prev => prev.map(item =>
            item.itemId === itemId ? { ...item, checked: !item.checked } : item
        ));
    }, []);

    // Clear all checked items
    const clearChecked = useCallback(() => {
        setItems(prev => prev.filter(item => !item.checked));
    }, []);

    // Clear entire list
    const clearList = useCallback(() => {
        setItems([]);
        setListName("My Run");
    }, []);

    // Generate Share Link
    const getShareLink = useCallback(() => {
        const payload: ShoppingListPayload = {
            v: 1,
            n: listName,
            i: items.reduce((acc, item) => {
                if (item.quantity > 0) {
                    acc[item.itemId] = item.quantity;
                }
                return acc;
            }, {} as Record<number, number>)
        };
        const compressed = compressListPayload(payload);
        const url = `${window.location.origin}${window.location.pathname}#d=${compressed}`;
        
        // Update the URL hash
        window.history.replaceState(null, '', `#d=${compressed}`);
        
        return url;
    }, [listName, items]);

    return {
        listName,
        setListName,
        items,
        updateQuantity,
        toggleCheck,
        clearChecked,
        clearList,
        getShareLink,
        isLoaded,
        loadedFromUrl
    };
};
