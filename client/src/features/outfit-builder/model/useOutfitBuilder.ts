'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import type { OutfitSlots, SavedOutfit } from '@/entities/outfit/model/types';
import {
  CATEGORY_LABELS,
  FILTER_ORDER,
  SLOT_ORDER,
} from '@/entities/wardrobe-item/model/constants';
import type { ClothingCategory, ClothingItem } from '@/entities/wardrobe-item/model/types';
import {
  createLook,
  getCloths,
  getLooks,
  mapServerClothToItem,
} from '@/features/outfit-builder/api/outfitBuilderApi';

export const useOutfitBuilder = () => {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [selected, setSelected] = useState<OutfitSlots>({
    top: null,
    bottom: null,
    shoes: null,
  });
  const [outfitName, setOutfitName] = useState('');
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | ClothingCategory>('all');
  const [activeDropSlot, setActiveDropSlot] = useState<ClothingCategory | null>(null);
  const [serverItems, setServerItems] = useState<ClothingItem[]>([]);

  const allItems = useMemo(() => serverItems, [serverItems]);
  const itemsById = useMemo(() => new Map(serverItems.map((item) => [item.id, item])), [serverItems]);

  useEffect(() => {
    if (!isHydrated) return;

    let isMounted = true;

    const bootstrap = async () => {
      try {
        const [cloths, looks] = await Promise.all([getCloths(), getLooks()]);
        if (!isMounted) return;

        setServerItems(
          cloths
            .map(mapServerClothToItem)
            .filter((item): item is ClothingItem => item !== null),
        );
        setSavedOutfits(
          looks.map((look) => ({
            id: String(look.id),
            name: look.title,
            itemIds: look.cloth_ids.map(String),
            createdAt: look.createdAt,
          })),
        );
      } catch (error) {
        console.error('Failed to bootstrap outfit builder', error);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [isHydrated]);

  const usedCountByItem = useMemo(() => {
    const counter = new Map<string, number>();

    savedOutfits.forEach((outfit) => {
      outfit.itemIds.forEach((itemId) => {
        counter.set(itemId, (counter.get(itemId) ?? 0) + 1);
      });
    });

    return counter;
  }, [savedOutfits]);

  const allSlotsFilled = SLOT_ORDER.every((category) => !!selected[category]);
  const filteredItems =
    activeFilter === 'all'
      ? allItems
      : allItems.filter((item) => item.category === activeFilter);

  const setItemToSlot = (item: ClothingItem) => {
    setSelected((prev) => ({
      ...prev,
      [item.category]: item.id,
    }));
    setMessage(null);
  };

  const removeFromSlot = (category: ClothingCategory) => {
    setSelected((prev) => ({
      ...prev,
      [category]: null,
    }));
    setMessage(null);
  };

  const saveOutfit = async () => {
    if (!allSlotsFilled) {
      setMessage('Заполни все слоты: верх, низ и обувь.');
      return;
    }

    const cleanName = outfitName.trim();
    if (!cleanName) {
      setMessage('Добавь название образа, чтобы сохранить его.');
      return;
    }

    const itemIds = SLOT_ORDER.map((category) => selected[category]).filter(Boolean) as string[];
    try {
      const savedLook = await createLook({
        title: cleanName,
        cloth_ids: itemIds.map((id) => Number(id)).filter(Number.isFinite),
      });

      const newOutfit: SavedOutfit = {
        id: String(savedLook.id),
        name: savedLook.title,
        itemIds: savedLook.cloth_ids.map(String),
        createdAt: savedLook.createdAt,
      };
      const next = [newOutfit, ...savedOutfits].slice(0, 8);
      setSavedOutfits(next);
      setOutfitName('');
      setMessage('Образ сохранён в базе данных.');
    } catch (error) {
      console.error('Failed to save look', error);
      setMessage('Не удалось сохранить образ в базу.');
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLElement>, item: ClothingItem) => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.id, category: item.category }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (event: React.DragEvent<HTMLDivElement>, slotCategory: ClothingCategory) => {
    event.preventDefault();
    setActiveDropSlot(null);
    const rawData = event.dataTransfer.getData('text/plain');
    if (!rawData) {
      return;
    }

    try {
      const payload = JSON.parse(rawData) as { itemId: string; category: ClothingCategory };
      const item = itemsById.get(payload.itemId);
      if (!item) {
        return;
      }
      if (item.category !== slotCategory) {
        setMessage(`Нельзя положить "${item.name}" в слот "${CATEGORY_LABELS[slotCategory]}".`);
        return;
      }

      setItemToSlot(item);
      setMessage(`"${item.name}" добавлен в слот "${CATEGORY_LABELS[slotCategory]}".`);
    } catch {
      setMessage('Не удалось перетащить вещь. Попробуй ещё раз.');
    }
  };

  return {
    isHydrated,
    selected,
    outfitName,
    setOutfitName,
    savedOutfits,
    message,
    activeFilter,
    setActiveFilter,
    allItems,
    filteredItems,
    itemsById,
    usedCountByItem,
    activeDropSlot,
    setActiveDropSlot,
    setItemToSlot,
    removeFromSlot,
    saveOutfit,
    handleDragStart,
    handleDropOnSlot,
    constants: {
      categoryLabels: CATEGORY_LABELS,
      filterOrder: FILTER_ORDER,
      slotOrder: SLOT_ORDER,
    },
  };
};
