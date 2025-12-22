import LZString from 'lz-string';

export interface ShoppingListPayload {
    v: number;       // version
    n: string;       // list name
    i: Record<number, number>; // itemId -> quantity (legacy v1)
    // v2 additions:
    c?: { id: string; name: string; phase: number }[];  // categories with phase
    p?: Record<number, number>;  // itemId -> phase number mapping
    // v3 additions:
    k?: number[];  // array of itemIds that are checked/collected
}

export const compressListPayload = (payload: ShoppingListPayload): string => {
    try {
        const json = JSON.stringify(payload);
        // compressToEncodedURIComponent is URL safe
        return LZString.compressToEncodedURIComponent(json);
    } catch (e) {
        console.error("Compression failed", e);
        return "";
    }
};

export const decompressListPayload = (hash: string): ShoppingListPayload | null => {
    try {
        if (!hash) return null;
        const json = LZString.decompressFromEncodedURIComponent(hash);
        if (!json) return null;
        return JSON.parse(json);
    } catch (e) {
        console.error("Decompression failed", e);
        return null;
    }
};
