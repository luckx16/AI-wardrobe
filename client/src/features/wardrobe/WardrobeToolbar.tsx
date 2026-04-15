import type { Season, Category } from "@/data/wardrobeItems";

type SortField = "name" | "season" | "dateAdded" | "category";

interface WardrobeToolbarProps {
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
  filterSeason: Season | "all";
  onFilterSeasonChange: (season: Season | "all") => void;
  filterCategory: Category | "all";
  onFilterCategoryChange: (cat: Category | "all") => void;
  totalCount: number;
  addButton?: React.ReactNode;
}

const seasons: (Season | "all")[] = ["all", "Зима", "Весна", "Лето", "Осень", "Все сезоны"];
const categories: (Category | "all")[] = [
  "all", "Верхняя одежда", "Футболки", "Брюки", "Свитеры", "Обувь", "Рубашки",
];

const sortOptions: { value: SortField; label: string }[] = [
  { value: "name", label: "По названию" },
  { value: "season", label: "По сезону" },
  { value: "category", label: "По категории" },
  { value: "dateAdded", label: "По дате" },
];

const WardrobeToolbar = ({
  sortBy,
  onSortChange,
  filterSeason,
  onFilterSeasonChange,
  filterCategory,
  onFilterCategoryChange,
  totalCount,
  addButton,
}: WardrobeToolbarProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Мой гардероб
          </h1>
          <p className="text-sm text-muted mt-1">
            {totalCount} {totalCount === 1 ? "предмет" : "предметов"}
          </p>
        </div>
        {addButton}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-3 items-center border-b border-border pb-4">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Сортировка
          </span>
          <div className="flex gap-1">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  sortBy === opt.value
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-5 bg-border hidden sm:block" />

        {/* Season filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Сезон
          </span>
          <select
            value={filterSeason}
            onChange={(e) => onFilterSeasonChange(e.target.value as Season | "all")}
            className="text-xs bg-surface-elevated border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Все" : s}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">
            Категория
          </span>
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategoryChange(e.target.value as Category | "all")}
            className="text-xs bg-surface-elevated border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Все" : c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default WardrobeToolbar;