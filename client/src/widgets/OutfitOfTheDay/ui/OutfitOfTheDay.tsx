'use client';

import styles from './OutfitOfTheDay.module.css';

type OutfitItem = {
  id: string | number;
  emoji: string;
  name: string;
  category: string;
};

type Outfit = {
  weather: string;
  items: OutfitItem[];
  tip: string;
};

type OutfitOfTheDayProps = {
  outfit: Outfit;
  onRefresh?: () => void;
  weatherIcon?: React.ReactNode;
  sparkleIcon?: React.ReactNode;
};

export function OutfitOfTheDay({ outfit, onRefresh, weatherIcon, sparkleIcon }: OutfitOfTheDayProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconWrap}>
            {sparkleIcon ?? <span className={styles.icon}>✦</span>}
          </div>
          <h3 className={styles.title}>Образ дня от AI</h3>
        </div>
        <button className={styles.refreshBtn} onClick={onRefresh} type="button">
          Обновить
        </button>
      </div>

      <div className={styles.weather}>
        {weatherIcon && <span className={styles.weatherIcon}>{weatherIcon}</span>}
        <span className={styles.weatherText}>{outfit.weather}</span>
      </div>

      <div className={styles.list}>
        {outfit.items.map((item) => (
          <div key={item.id} className={styles.item}>
            <span className={styles.itemEmoji}>{item.emoji}</span>
            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.name}</p>
              <p className={styles.itemCategory}>{item.category}</p>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.tip}>{outfit.tip}</p>
    </div>
  );
}
