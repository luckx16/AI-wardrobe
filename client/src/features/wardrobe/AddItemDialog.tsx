import { useState, useRef, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Season, Category, WardrobeItem } from "@/data/wardrobeItems";
import { Plus, ImagePlus, X } from "lucide-react";

const seasons: Season[] = ["Зима", "Весна", "Лето", "Осень", "Все сезоны"];
const categories: Category[] = [
  "Верхняя одежда",
  "Футболки",
  "Брюки",
  "Свитеры",
  "Обувь",
  "Рубашки",
];

interface AddItemDialogProps {
  onAdd: (item: WardrobeItem) => void;
}

const AddItemDialog = ({ onAdd }: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Футболки");
  const [season, setSeason] = useState<Season>("Все сезоны");
  const [color, setColor] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setCategory("Футболки");
    setSeason("Все сезоны");
    setColor("");
    setImagePreview(null);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = () => {
    if (!name.trim() || !imagePreview) return;
    const item: WardrobeItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category,
      season,
      color: color.trim() || "—",
      image: imagePreview,
      dateAdded: new Date().toISOString().slice(0, 10),
    };
    onAdd(item);
    reset();
    setOpen(false);
  };

  const isValid = name.trim().length > 0 && imagePreview;

  const selectClasses =
    "w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-border text-foreground hover:bg-surface-elevated"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Новый предмет</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Image upload */}
          <div>
            <Label className="text-xs font-medium text-muted uppercase tracking-wider mb-2 block">
              Фото
            </Label>
            {imagePreview ? (
              <div className="relative w-full aspect-[4/5] max-h-56 rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-foreground/70 text-background hover:bg-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/5] max-h-56 rounded-lg border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 text-muted hover:text-accent transition-colors"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs font-medium">Загрузить фото</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="item-name" className="text-xs font-medium text-muted uppercase tracking-wider">
              Название
            </Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Кашемировый свитер"
              className="mt-1.5 border-border bg-surface-elevated text-foreground placeholder:text-muted/50"
            />
          </div>

          {/* Category & Season row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted uppercase tracking-wider">
                Категория
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={`${selectClasses} mt-1.5`}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted uppercase tracking-wider">
                Сезон
              </Label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className={`${selectClasses} mt-1.5`}
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <Label htmlFor="item-color" className="text-xs font-medium text-muted uppercase tracking-wider">
              Цвет
            </Label>
            <Input
              id="item-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Например: Бежевый"
              className="mt-1.5 border-border bg-surface-elevated text-foreground placeholder:text-muted/50"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
          >
            Добавить в гардероб
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;