import type { WardrobeItem } from "../../../src/app/wardrobe/types";

interface WardrobeCardProps {
  item: WardrobeItem;
  index: number;
}

const WardrobeCard = ({ item, index }: WardrobeCardProps) => {
  return (
    <div
      className="group rounded-lg border border-border bg-surface overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="aspect-[4/5] overflow-hidden bg-surface-elevated">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={512}
          height={640}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground leading-tight">
          {item.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{item.category}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-muted font-medium">
            {item.season}
          </span>
        </div>
        <p className="text-xs text-muted">{item.color}</p>
      </div>
    </div>
  );
};

export default WardrobeCard;