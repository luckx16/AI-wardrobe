'use client';

import Image from 'next/image';
import { useMemo, useState, useSyncExternalStore } from 'react';

import styles from './page.module.css';

type ClothingCategory = 'top' | 'bottom' | 'shoes';

type ClothingItem = {
  id: string;
  name: string;
  category: ClothingCategory;
  color: string;
  description: string;
  icon: string;
  imageUrl?: string;
};

type OutfitSlots = {
  top: string | null;
  bottom: string | null;
  shoes: string | null;
};

type SavedOutfit = {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: string;
};

const ITEMS: ClothingItem[] = [
  {
    id: 'item-top-1',
    name: 'Oversized Hoodie',
    category: 'top',
    color: '#d8c7b6',
    description: 'Тёплый верх для повседневного образа.',
    icon: '🧥',
  },
  {
    id: 'item-top-2',
    name: 'Minimal Shirt',
    category: 'top',
    color: '#dadada',
    description: 'Базовая рубашка в чистом стиле.',
    icon: '👕',
  },
  {
    id: 'item-bottom-1',
    name: 'Straight Jeans',
    category: 'bottom',
    color: '#8ca2b3',
    description: 'Джинсы прямого кроя.',
    icon: '👖',
  },
  {
    id: 'item-bottom-2',
    name: 'Tailored Pants',
    category: 'bottom',
    color: '#8f877f',
    description: 'Брюки для более строгого образа.',
    icon: '🩳',
  },
  {
    id: 'item-shoes-1',
    name: 'Clean Sneakers',
    category: 'shoes',
    color: '#efefef',
    description: 'Лаконичные кеды.',
    icon: '👟',
  },
  {
    id: 'item-shoes-2',
    name: 'Leather Boots',
    category: 'shoes',
    color: '#5a4b3e',
    description: 'Ботинки с выразительной фактурой.',
    icon: '🥾',
  },
];

const STORAGE_KEY = 'ai-wardrobe.saved-outfits';
const CUSTOM_ITEMS_STORAGE_KEY = 'ai-wardrobe.custom-items';
const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  top: 'Верх',
  bottom: 'Низ',
  shoes: 'Обувь',
};

const SLOT_ORDER: ClothingCategory[] = ['top', 'bottom', 'shoes'];
const FILTER_ORDER: Array<'all' | ClothingCategory> = ['all', 'top', 'bottom', 'shoes'];

const isCustomItem = (itemId: string) => itemId.startsWith('custom-');

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

const readStorageArray = <T,>(storageKey: string): T[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function OutfitBuilderPage() {
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
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    readStorageArray<SavedOutfit>(STORAGE_KEY),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | ClothingCategory>('all');
  const [customItems, setCustomItems] = useState<ClothingItem[]>(() =>
    readStorageArray<ClothingItem>(CUSTOM_ITEMS_STORAGE_KEY),
  );
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ClothingCategory>('top');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemColor, setNewItemColor] = useState('#c9b39d');
  const [newItemPhoto, setNewItemPhoto] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeDropSlot, setActiveDropSlot] = useState<ClothingCategory | null>(null);

  const allItems = useMemo(() => [...ITEMS, ...customItems], [customItems]);
  const itemsById = useMemo(
    () => new Map(allItems.map((item) => [item.id, item])),
    [allItems],
  );

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
    window.localStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(nextItems));
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

    const nextCustomItems = customItems.filter((item) => item.id !== itemId);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOutfits));
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

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    item: ClothingItem,
  ) => {
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

  if (!isHydrated) {
    return (
      <section className={styles.page}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Outfit Builder:</p>
          <h1 className={styles.title}>Собери образ из вещей гардероба</h1>
          <p className={styles.subtitle}>Загружаем твой гардероб...</p>
        </header>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Outfit Builder:</p>
        <h1 className={styles.title}>Собери образ из вещей гардероба</h1>
        <p className={styles.subtitle}>
          Слева выбираешь вещи, справа сразу видишь, как выглядит комплект в сборке.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.panel}>
          <h2 className={styles.panelTitle}>Список вещей</h2>
          <p className={styles.panelHint}>Каждую вещь можно добавлять в разные сохранённые образы.</p>
          <div className={styles.createItemCard}>
            <p className={styles.createItemTitle}>
              {editingItemId ? 'Редактировать вещь' : 'Добавить новую вещь'}
            </p>
            <div className={styles.createFields}>
              <input
                className={styles.input}
                value={newItemName}
                onChange={(event) => setNewItemName(event.target.value)}
                placeholder="Название вещи"
              />
              <select
                className={styles.input}
                value={newItemCategory}
                onChange={(event) => setNewItemCategory(event.target.value as ClothingCategory)}
              >
                <option value="top">{CATEGORY_LABELS.top}</option>
                <option value="bottom">{CATEGORY_LABELS.bottom}</option>
                <option value="shoes">{CATEGORY_LABELS.shoes}</option>
              </select>
              <input
                className={styles.input}
                value={newItemDescription}
                onChange={(event) => setNewItemDescription(event.target.value)}
                placeholder="Краткое описание"
              />
              <div className={styles.colorField}>
                <label className={styles.label} htmlFor="new-item-color">
                  Цвет вещи
                </label>
                <input
                  id="new-item-color"
                  className={styles.colorInput}
                  type="color"
                  value={newItemColor}
                  onChange={(event) => setNewItemColor(event.target.value)}
                />
              </div>
              <label className={styles.fileLabel} htmlFor="new-item-photo">
                {newItemPhoto ? 'Фото загружено (можно заменить)' : 'Загрузить фото вещи'}
              </label>
              <input
                id="new-item-photo"
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(event) => void handlePhotoUpload(event.target.files?.[0] ?? null)}
              />
              <div className={styles.formActions}>
                <button type="button" className={styles.saveButton} onClick={addNewItem}>
                  {editingItemId ? 'Сохранить изменения' : 'Добавить вещь'}
                </button>
                {editingItemId ? (
                  <button type="button" className={styles.ghostButton} onClick={resetItemForm}>
                    Отмена
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className={styles.filterRow}>
            {FILTER_ORDER.map((filterValue) => (
              <button
                key={filterValue}
                type="button"
                className={styles.filterButton}
                data-active={activeFilter === filterValue}
                onClick={() => setActiveFilter(filterValue)}
              >
                {filterValue === 'all' ? 'Все' : CATEGORY_LABELS[filterValue]}
              </button>
            ))}
          </div>
          <ul className={styles.itemsList}>
            {filteredItems.map((item) => {
              const isSelected = selected[item.category] === item.id;
              const usedCount = usedCountByItem.get(item.id) ?? 0;
              const customIndex = customItems.findIndex((entry) => entry.id === item.id);
              const canMoveUp = customIndex > 0;
              const canMoveDown = customIndex > -1 && customIndex < customItems.length - 1;

              return (
                <li
                  key={item.id}
                  className={styles.itemCard}
                  draggable
                  onDragStart={(event) => handleDragStart(event, item)}
                  onDragEnd={() => setActiveDropSlot(null)}
                >
                  <div className={styles.itemMain}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={44}
                        height={44}
                        className={styles.itemImage}
                        unoptimized
                      />
                    ) : (
                      <span className={styles.itemIcon} aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    <span className={styles.color} style={{ backgroundColor: item.color }} />
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {CATEGORY_LABELS[item.category]} · В образах: {usedCount}
                      </p>
                      <p className={styles.itemDescription}>{item.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setItemToSlot(item)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? 'В образе' : 'Добавить'}
                  </button>
                  {isCustomItem(item.id) ? (
                    <div className={styles.itemControls}>
                      <button
                        type="button"
                        className={styles.secondaryActionButton}
                        onClick={() => moveCustomItem(item.id, 'up')}
                        disabled={!canMoveUp}
                      >
                        Выше
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryActionButton}
                        onClick={() => moveCustomItem(item.id, 'down')}
                        disabled={!canMoveDown}
                      >
                        Ниже
                      </button>
                      <button type="button" className={styles.secondaryActionButton} onClick={() => startEditItem(item)}>
                        Изменить
                      </button>
                      <button type="button" className={styles.deleteActionButton} onClick={() => deleteCustomItem(item.id)}>
                        Удалить
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </aside>

        <section className={styles.canvasSection}>
          <div className={styles.canvasHeader}>
            <h2 className={styles.panelTitle}>Холст образа</h2>
            <p className={styles.panelHint}>Манекен собирает образ по слоям: верх, низ и обувь.</p>
          </div>

          <div className={styles.mannequin}>
            <div className={styles.head} />
            <div className={styles.body}>
              {SLOT_ORDER.map((category) => {
                const itemId = selected[category];
                const item = itemId ? itemsById.get(itemId) : undefined;
                const slotClassName =
                  category === 'top'
                    ? styles.mannequinTop
                    : category === 'bottom'
                      ? styles.mannequinBottom
                      : styles.mannequinShoes;

                return (
                  <div
                    key={category}
                    className={`${styles.mannequinSlot} ${slotClassName}`}
                    data-active-drop={activeDropSlot === category}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setActiveDropSlot(category);
                    }}
                    onDragLeave={() => setActiveDropSlot(null)}
                    onDrop={(event) => handleDropOnSlot(event, category)}
                  >
                    <span className={styles.slotTag}>{CATEGORY_LABELS[category]}</span>
                    {item ? (
                      <div className={styles.mannequinItem} style={{ backgroundColor: item.color }}>
                        {item.imageUrl ? (
                          <div className={styles.mannequinPhotoFrame}>
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={220}
                              height={140}
                              className={styles.mannequinImage}
                              unoptimized
                            />
                          </div>
                        ) : (
                          <span className={styles.mannequinItemIcon}>{item.icon}</span>
                        )}
                        <span>{item.name}</span>
                      </div>
                    ) : (
                      <span className={styles.slotGhost}>Пусто</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.canvas}>
            {SLOT_ORDER.map((category) => {
              const itemId = selected[category];
              const item = itemId ? itemsById.get(itemId) : undefined;

              return (
                <article key={category} className={styles.slotCard}>
                  <div className={styles.slotLabelRow}>
                    <span className={styles.slotLabel}>{CATEGORY_LABELS[category]}</span>
                    {item ? (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeFromSlot(category)}
                      >
                        Убрать
                      </button>
                    ) : null}
                  </div>
                  {item ? (
                    <div className={styles.slotContent}>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={72}
                          height={72}
                          className={styles.slotPhoto}
                          unoptimized
                        />
                      ) : (
                        <span className={styles.slotFallbackIcon}>{item.icon}</span>
                      )}
                      <span className={styles.slotColor} style={{ backgroundColor: item.color }} />
                      <div>
                        <p className={styles.slotName}>{item.name}</p>
                        <p className={styles.slotDescription}>{item.description}</p>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.slotPlaceholder}>Добавь вещь из списка слева</p>
                  )}
                </article>
              );
            })}
          </div>

          <div className={styles.saveBlock}>
            <label className={styles.label} htmlFor="outfit-name">
              Название образа
            </label>
            <input
              id="outfit-name"
              className={styles.input}
              value={outfitName}
              onChange={(event) => setOutfitName(event.target.value)}
              placeholder="Например: Smart Casual Friday"
            />
            <button type="button" className={styles.saveButton} onClick={saveOutfit}>
              Сохранить образ
            </button>
            {message ? <p className={styles.message}>{message}</p> : null}
          </div>
        </section>
      </div>

      <section className={styles.savedSection}>
        <h2 className={styles.savedTitle}>Сохранённые образы</h2>
        {savedOutfits.length === 0 ? (
          <p className={styles.savedHint}>Пока пусто. Собери первый образ и сохрани его.</p>
        ) : (
          <ul className={styles.savedList}>
            {savedOutfits.map((outfit) => (
              <li key={outfit.id} className={styles.savedCard}>
                <p className={styles.savedName}>{outfit.name}</p>
                <p className={styles.savedMeta}>
                  {new Date(outfit.createdAt).toLocaleDateString('ru-RU')} · {outfit.itemIds.length} items
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
