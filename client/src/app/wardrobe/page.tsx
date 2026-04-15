import { useMemo, useState, useCallback } from "react";
import WardrobeCard from "../../features/wardrobe/WardrobeCard";
import WardrobeToolbar from "../../features/wardrobe/WardrobeToolbar";
import AddItemDialog from "../../features/wardrobe/AddItemDialog";
import { wardrobeItems, type Season, type Category, type WardrobeItem } from "./types";

type SortField = "name" | "season" | "dateAdded" | "category";

const Index = () => {
  const [items, setItems] = useState<WardrobeItem[]>(wardrobeItems);
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [filterSeason, setFilterSeason] = useState<Season | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

  const handleAddItem = useCallback((item: WardrobeItem) => {
    setItems((prev) => [item, ...prev]);
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];

    if (filterSeason !== "all") {
      result = result.filter((i) => i.season === filterSeason);
    }
    if (filterCategory !== "all") {
      result = result.filter((i) => i.category === filterCategory);
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ru");
      if (sortBy === "season") return a.season.localeCompare(b.season, "ru");
      if (sortBy === "category") return a.category.localeCompare(b.category, "ru");
      return b.dateAdded.localeCompare(a.dateAdded);
    });

    return result;
  }, [items, sortBy, filterSeason, filterCategory]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
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
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <p className="text-lg font-medium">Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((item, i) => (
              <WardrobeCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;