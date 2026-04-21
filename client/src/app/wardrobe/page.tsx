'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AddItemDialog from '../../features/wardrobe/AddItemDialog';
import EditItemDialog from '../../features/wardrobe/EditItemDialog';
import { getAll, removeClothesItem } from '../../features/wardrobe/api/wardrobeApi';
import ItemDetailDialog from '../../features/wardrobe/ItemDetailDialog';
import WardrobeCard from '../../features/wardrobe/WardrobeCard';
import WardrobeToolbar from '../../features/wardrobe/WardrobeToolbar';
import { type Category, type Season, type WardrobeItem } from './types';
import styles from './WardrobePage.module.css';

type SortField = 'title' | 'season' | 'createdAt' | 'category';

const WardrobePage = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('title');
  const [filterSeason, setFilterSeason] = useState<Season | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);

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

  const handleEditItem = useCallback(
    (id: string) => {
      const item = items.find((currentItem) => String(currentItem.id) === String(id));

      if (item) {
        setEditingItem(item);
      }
    },
    [items],
  );

  const handleSaveEditItem = useCallback(async (updatedItem: WardrobeItem) => {
    setItems((prev) =>
      prev.map((item) => (String(item.id) === String(updatedItem.id) ? updatedItem : item)),
    );
    setSelectedItem((current) =>
      current && String(current.id) === String(updatedItem.id) ? updatedItem : current,
    );
    setEditingItem(null);

    try {
      const freshItems = await getAll();
      setItems(freshItems);
      setSelectedItem((current) => {
        if (!current) return current;
        const refreshed = freshItems.find((item) => String(item.id) === String(current.id));
        return refreshed ?? current;
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];

    if (filterSeason !== 'all') {
      result = result.filter((i) => i.season === filterSeason);
    }
    if (filterCategory !== 'all') {
      result = result.filter((i) => i.category === filterCategory);
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
                onEdit={handleEditItem}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>
      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onOpenChange={(v) => {
          if (!v) setEditingItem(null);
        }}
        onSave={handleSaveEditItem}
      />
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
