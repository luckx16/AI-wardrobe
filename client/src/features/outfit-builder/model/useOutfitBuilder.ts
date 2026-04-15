'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

import { readSavedOutfits, writeSavedOutfits } from '@/entities/outfit/model/storage';
import type { OutfitSlots, SavedOutfit } from '@/entities/outfit/model/types';
import {
  BASE_ITEMS,
  CATEGORY_LABELS,
  FILTER_ORDER,
  MAX_UPLOAD_SIZE_BYTES,
  SLOT_ORDER,
} from '@/entities/wardrobe-item/model/constants';
import {
  isCustomItem,
  readCustomItems,
  writeCustomItems,
} from '@/entities/wardrobe-item/model/storage';
import type { ClothingCategory, ClothingItem } from '@/entities/wardrobe-item/model/types';

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Не удалось прочитать изображение.'));
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
    reader.readAsDataURL(file);
  });

const compressDataUrlImage = (dataUrl: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSide = 1100;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Не удалось подготовить изображение.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => reject(new Error('Не удалось обработать изображение.'));
    image.src = dataUrl;
  });

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
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() => readSavedOutfits());
  const [message, setMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | ClothingCategory>('all');
  const [customItems, setCustomItems] = useState<ClothingItem[]>(() => readCustomItems());
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ClothingCategory>('top');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemColor, setNewItemColor] = useState('#c9b39d');
  const [newItemPhoto, setNewItemPhoto] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeDropSlot, setActiveDropSlot] = useState<ClothingCategory | null>(null);

  const allItems = useMemo(() => [...BASE_ITEMS, ...customItems], [customItems]);
  const itemsById = useMemo(() => new Map(allItems.map((item) => [item.id, item])), [allItems]);

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

  const saveCustomItems = (nextItems: ClothingItem[]) => {
    setCustomItems(nextItems);
    writeCustomItems(nextItems);
  };

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

  const saveOutfit = () => {
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
    const newOutfit: SavedOutfit = {
      id: crypto.randomUUID(),
      name: cleanName,
      itemIds,
      createdAt: new Date().toISOString(),
    };
    const next = [newOutfit, ...savedOutfits].slice(0, 8);
    setSavedOutfits(next);
    writeSavedOutfits(next);
    setOutfitName('');
    setMessage('Образ сохранён. Вещи теперь связаны с ним через many-to-many.');
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) {
      setNewItemPhoto(null);
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setMessage('Файл слишком большой. Выбери фото до 8MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const compressedDataUrl = await compressDataUrlImage(dataUrl);
      setNewItemPhoto(compressedDataUrl);
      setMessage(null);
    } catch {
      setMessage('Не получилось обработать фото. Попробуй другое изображение.');
    }
  };

  const resetItemForm = () => {
    setNewItemName('');
    setNewItemDescription('');
    setNewItemPhoto(null);
    setNewItemColor('#c9b39d');
    setNewItemCategory('top');
    setEditingItemId(null);
  };

  const startEditItem = (item: ClothingItem) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemDescription(item.description);
    setNewItemColor(item.color);
    setNewItemPhoto(item.imageUrl ?? null);
    setMessage('Режим редактирования: измени поля и нажми "Сохранить изменения".');
  };

  const deleteCustomItem = (itemId: string) => {
    const item = customItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    const shouldDelete = window.confirm(`Удалить вещь "${item.name}"? Это действие нельзя отменить.`);
    if (!shouldDelete) {
      return;
    }

    const nextCustomItems = customItems.filter((entry) => entry.id !== itemId);
    saveCustomItems(nextCustomItems);
    setSelected((prev) => ({
      top: prev.top === itemId ? null : prev.top,
      bottom: prev.bottom === itemId ? null : prev.bottom,
      shoes: prev.shoes === itemId ? null : prev.shoes,
    }));

    const nextOutfits = savedOutfits
      .map((outfit) => ({
        ...outfit,
        itemIds: outfit.itemIds.filter((currentId) => currentId !== itemId),
      }))
      .filter((outfit) => outfit.itemIds.length > 0);

    setSavedOutfits(nextOutfits);
    writeSavedOutfits(nextOutfits);

    if (editingItemId === itemId) {
      resetItemForm();
    }
    setMessage('Пользовательская вещь удалена.');
  };

  const moveCustomItem = (itemId: string, direction: 'up' | 'down') => {
    const index = customItems.findIndex((item) => item.id === itemId);
    if (index === -1) {
      return;
    }
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= customItems.length) {
      return;
    }

    const nextItems = [...customItems];
    const [movedItem] = nextItems.splice(index, 1);
    nextItems.splice(nextIndex, 0, movedItem);
    saveCustomItems(nextItems);
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

  const addNewItem = () => {
    const cleanName = newItemName.trim();
    const cleanDescription = newItemDescription.trim();

    if (!cleanName) {
      setMessage('Укажи название новой вещи.');
      return;
    }
    if (!cleanDescription) {
      setMessage('Добавь краткое описание новой вещи.');
      return;
    }
    if (!newItemPhoto) {
      setMessage('Добавь фото вещи, чтобы можно было собирать образ из фото.');
      return;
    }

    const fallbackIcon = newItemCategory === 'top' ? '👕' : newItemCategory === 'bottom' ? '👖' : '👟';
    const newItem: ClothingItem = {
      id: editingItemId ?? `custom-${crypto.randomUUID()}`,
      name: cleanName,
      category: newItemCategory,
      color: newItemColor,
      description: cleanDescription,
      icon: fallbackIcon,
      imageUrl: newItemPhoto,
    };

    const next = editingItemId
      ? customItems.map((item) => (item.id === editingItemId ? newItem : item))
      : [newItem, ...customItems].slice(0, 30);
    saveCustomItems(next);

    if (editingItemId) {
      setSelected((prev) => ({
        top: prev.top === editingItemId ? editingItemId : prev.top,
        bottom: prev.bottom === editingItemId ? editingItemId : prev.bottom,
        shoes: prev.shoes === editingItemId ? editingItemId : prev.shoes,
      }));
    }

    resetItemForm();
    setActiveFilter(newItemCategory);
    setMessage(editingItemId ? 'Вещь обновлена.' : 'Новая вещь добавлена. Теперь её можно использовать в образах.');
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
    customItems,
    allItems,
    filteredItems,
    itemsById,
    usedCountByItem,
    newItemName,
    setNewItemName,
    newItemCategory,
    setNewItemCategory,
    newItemDescription,
    setNewItemDescription,
    newItemColor,
    setNewItemColor,
    newItemPhoto,
    editingItemId,
    activeDropSlot,
    setActiveDropSlot,
    setItemToSlot,
    removeFromSlot,
    saveOutfit,
    handlePhotoUpload,
    resetItemForm,
    startEditItem,
    deleteCustomItem,
    moveCustomItem,
    handleDragStart,
    handleDropOnSlot,
    addNewItem,
    constants: {
      categoryLabels: CATEGORY_LABELS,
      filterOrder: FILTER_ORDER,
      slotOrder: SLOT_ORDER,
      isCustomItem,
    },
  };
};
