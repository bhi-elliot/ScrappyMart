import itemsData from '../../data/items.json';

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Item {
    id: number;
    name: string;
    category: string;
    rarity: ItemRarity | string;
    description: string;
    stack: number | null;
    weight: number | null;
    cost: number | null;
    effects: any[];
    craftingRecipe: any | null;
    recyclesInto: any[];
    salvagesInto: any[];
    imageFile: string | null;
}

// Map for quick lookup
export const itemsMap = new Map<number, Item>();

itemsData.items.forEach((item: any) => {
    itemsMap.set(item.id, item);
});

export const getAllItems = () => itemsData.items as Item[];

export const getItem = (id: number): Item | undefined => itemsMap.get(id);
