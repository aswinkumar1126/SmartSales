import { useMemo, useCallback } from "react";

type Item = {
    label: string;
    value: string;
};

export const useIsTaggedItem = (items: Item[]) => {
    console.log(items,'itemsitems')

    if(!items) return () => false;

    // 🔥 Create Set only when items change
    const valueSet = useMemo(() => {
        return new Set(items.map(item => +item.value));
    }, [items]);

    // 🔥 Fast lookup (O(1))
    const isTaggedItem = useCallback((itemId: number | null) => {
        if (itemId === null || itemId === undefined) return false;
        return valueSet.has(itemId);
    }, [valueSet]);

    return isTaggedItem;
};