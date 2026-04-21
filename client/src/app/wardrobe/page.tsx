'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AddItemDialog from '../../features/wardrobe/AddItemDialog';
import {
  getAll,
  getClothProcessingStatus,
  removeClothesItem,
} from '../../features/wardrobe/api/wardrobeApi';
import ItemDetailDialog from '../../features/wardrobe/ItemDetailDialog';
import WardrobeCard from '../../features/wardrobe/WardrobeCard';
import WardrobeToolbar from '../../features/wardrobe/WardrobeToolbar';
import { type Category, type Season, type WardrobeItem } from './types';
import styles from './WardrobePage.module.css';

type SortField = 'title' | 'season' | 'createdAt' | 'category';

const categoryAliasToSection: Record<string, Category> = {
  футболка: 'top',
  поло: 'top',
  топ: 'top',
  рубашка: 'top',
  блузка: 'top',
  кофта: 'top',
  куртка: 'top',
  пальто: 'top',
  пиджак: 'top',
  тренч: 'top',
  пуховик: 'top',
  ветровка: 'top',
  жилет: 'top',
  свитер: 'top',
  джемпер: 'top',
  кардиган: 'top',
  худи: 'top',
  толстовка: 'top',
  платье: 'other',
  сарафан: 'other',
  комбинезон: 'other',
  брюки: 'bottom',
  джинсы: 'bottom',
  леггинсы: 'bottom',
  юбка: 'bottom',
  'мини-юбка': 'bottom',
  шорты: 'bottom',
  бермуды: 'bottom',
  кепка: 'headwear',
  шапка: 'headwear',
  шляпа: 'headwear',
  кроссовки: 'shoes',
  кеды: 'shoes',
  ботинки: 'shoes',
  сапоги: 'shoes',
  туфли: 'shoes',
  сандалии: 'shoes',
  обувь: 'shoes',
  сумка: 'bags',
  рюкзак: 'bags',
  галстук: 'accessory',
  ремень: 'accessory',
  шарф: 'accessory',
  перчатки: 'accessory',
  аксессуары: 'accessory',
  носки: 'accessory',
  'нижнее бельё': 'other',
  купальник: 'other',
  'спортивная одежда': 'other',
  'домашняя одежда': 'other',
  другое: 'other',
};

const sectionCategories = new Set<Category>([
  'headwear',
  'top',
  'accessory',
  'bags',
  'bottom',
  'shoes',
  'other',
]);

const normalizeItemCategory = (item: WardrobeItem): Category => {
  const rawCategory = item.category?.toLowerCase();
  if (rawCategory && sectionCategories.has(rawCategory as Category)) {
    return rawCategory as Category;
  }
  return categoryAliasToSection[rawCategory ?? ''] ?? 'other';
};

const WardrobePage = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('title');
  const [filterSeason, setFilterSeason] = useState<Season | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAll();

        setItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const processingItems = items.filter(
      (item) => item.processing_status === 'pending' || item.processing_status === 'processing',
    );
    if (!processingItems.length) return;

    const intervalId = window.setInterval(() => {
      void Promise.all(
        processingItems.map(async (item) => {
          try {
            const statusData = await getClothProcessingStatus(String(item.id));
            setItems((prev) =>
              prev.map((prevItem) =>
                prevItem.id === item.id
                  ? {
                      ...prevItem,
                      processing_status: statusData.processingStatus,
                      image:
                        statusData.imageUrl && statusData.processingStatus === 'completed'
                          ? `http://localhost:4000${statusData.imageUrl}`
                          : prevItem.image,
                    }
                  : prevItem,
              ),
            );
          } catch (error) {
            console.error(error);
          }
        }),
      );
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [items]);

  const handleAddItem = useCallback((item: WardrobeItem) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const handleDeleteItem = useCallback(async (id: number) => {
    try {
      await removeClothesItem(id.toString());

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];

    if (filterSeason !== 'all') {
      result = result.filter((i) => i.season === filterSeason);
    }
    if (filterCategory !== 'all') {
      result = result.filter((i) => normalizeItemCategory(i) === filterCategory);
    }

    result.sort((a: WardrobeItem, b: WardrobeItem) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ru');
      if (sortBy === 'season') return a.season.localeCompare(b.season, 'ru');
      if (sortBy === 'category') return a.category.localeCompare(b.category, 'ru');
      if (sortBy === 'createdAt') return a.createdAt.localeCompare(b.createdAt, 'ru');
      return 0;
    });

    return result;
  }, [items, sortBy, filterSeason, filterCategory]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <WardrobeToolbar
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterSeason={filterSeason}
          onFilterSeasonChange={setFilterSeason}
          filterCategory={filterCategory}
          onFilterCategoryChange={setFilterCategory}
          totalCount={filtered.length}
          addButton={<AddItemDialog onAdd={handleAddItem} />}
        />

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Ничего не найдено</p>
            <p className={styles.emptyText}>Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((item, i) => (
              <WardrobeCard
                key={item.id}
                item={item}
                index={i}
                onDelete={handleDeleteItem}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>
      <ItemDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(v) => {
          if (!v) setSelectedItem(null);
        }}
      />
    </div>
  );
};

export default WardrobePage;
