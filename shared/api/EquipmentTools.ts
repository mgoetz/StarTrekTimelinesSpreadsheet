import STTApi from './STTApi.ts';

export function loadFullTree(): Promise<void> {
    let mapEquipment: Set<number> = new Set();
    let missingEquipment: any[] = [];

    STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
        mapEquipment.add(equipment.id);
    });

    STTApi.itemArchetypeCache.archetypes.forEach((equipment: any) => {
        if (equipment.recipe && equipment.recipe.demands && (equipment.recipe.demands.length > 0)) {
            equipment.recipe.demands.forEach((item: any) => {
                if (!mapEquipment.has(item.archetype_id)) {
                    missingEquipment.push(item.archetype_id);
                }
            });
        }
    });

    console.log('Need ' + missingEquipment.length + ' item details');
    if (missingEquipment.length == 0) {
        return Promise.resolve();
    }

    return STTApi.executeGetRequest("item/description", { ids: missingEquipment.slice(0,20) }).then((data: any) => {
        if (data.item_archetype_cache && data.item_archetype_cache.archetypes) {
            STTApi.itemArchetypeCache.archetypes = STTApi.itemArchetypeCache.archetypes.concat(data.item_archetype_cache.archetypes);
            return loadFullTree();
        }
        return Promise.resolve();
    });
}