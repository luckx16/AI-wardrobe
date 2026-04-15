'use client';

import styles from './CategoryBreakdown.module.css';

type Category = {
  name: string;
  emoji: string;
  count: number;
  percentage: number;
};

type CategoryBreakdownProps = {
  categories: Category[];
};

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Категории</h3>
      <div className={styles.list}>
        {categories.map((cat) => (
          <div key={cat.name} className={styles.category}>
            <div className={styles.categoryMeta}>
              <span className={styles.categoryName}>
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </span>
              <span className={styles.categoryCount}>{cat.count} шт.</span>
            </div>
            <div className={styles.track}>
              <div className={styles.bar} style={{ width: `${cat.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
