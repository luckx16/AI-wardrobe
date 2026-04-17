'use client';

import Image from 'next/image';
import { useState } from 'react';

import styles from './outfits.module.css';

type ClothCategory = 'top' | 'bottom' | 'shoes' | 'accessory' | 'bag' | 'headwear';

interface Cloth {
  id: string;
  name: string;
  image: string;
  category: ClothCategory;
}

interface Look {
  id: string;
  title: string;
  tag: string;
  clothes: Cloth[];
}

const LOOKS: Look[] = [
  {
    id: '1',
    title: 'Soft Beige Layers',
    tag: 'Casual · Autumn',
    clothes: [
      {
        id: '1-1',
        name: 'Beige Shearling Jacket',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
      },
      {
        id: '1-2',
        name: 'Brown Bomber',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
      },
      {
        id: '1-3',
        name: 'Cream Joggers',
        category: 'bottom',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600',
      },
      {
        id: '1-4',
        name: 'Suede Loafers',
        category: 'shoes',
        image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600',
      },
      {
        id: '1-5',
        name: 'Suede Tote',
        category: 'bag',
        image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600',
      },
      {
        id: '1-6',
        name: 'Wool Beanie',
        category: 'headwear',
        image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600',
      },
    ],
  },
  {
    id: '2',
    title: 'Minimal Monochrome',
    tag: 'Office',
    clothes: [
      {
        id: '2-1',
        name: 'Black Blazer',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1591047139756-eb1763663d8e?w=600',
      },
      {
        id: '2-2',
        name: 'White Tee',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
      },
      {
        id: '2-3',
        name: 'Tailored Trousers',
        category: 'bottom',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600',
      },
      {
        id: '2-4',
        name: 'Leather Loafers',
        category: 'shoes',
        image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600',
      },
      {
        id: '2-5',
        name: 'Structured Bag',
        category: 'bag',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
      },
    ],
  },
  {
    id: '3',
    title: 'Evening Silk',
    tag: 'Date Night',
    clothes: [
      {
        id: '3-1',
        name: 'Silk Slip Top',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600',
      },
      {
        id: '3-2',
        name: 'Midi Skirt',
        category: 'bottom',
        image: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=600',
      },
      {
        id: '3-3',
        name: 'Strappy Heels',
        category: 'shoes',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
      },
      {
        id: '3-4',
        name: 'Gold Hoops',
        category: 'accessory',
        image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600',
      },
      {
        id: '3-5',
        name: 'Mini Bag',
        category: 'bag',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
      },
    ],
  },
  {
    id: '4',
    title: 'Denim & Knit',
    tag: 'Weekend',
    clothes: [
      {
        id: '4-1',
        name: 'Cream Knit',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600',
      },
      {
        id: '4-2',
        name: 'Straight Jeans',
        category: 'bottom',
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',
      },
      {
        id: '4-3',
        name: 'White Sneakers',
        category: 'shoes',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      },
      {
        id: '4-4',
        name: 'Canvas Tote',
        category: 'bag',
        image: 'https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=600',
      },
    ],
  },
  {
    id: '5',
    title: 'Tailored Camel',
    tag: 'Winter',
    clothes: [
      {
        id: '5-1',
        name: 'Camel Coat',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
      },
      {
        id: '5-2',
        name: 'Turtleneck',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600',
      },
      {
        id: '5-3',
        name: 'Wool Trousers',
        category: 'bottom',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600',
      },
      {
        id: '5-4',
        name: 'Ankle Boots',
        category: 'shoes',
        image: 'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=600',
      },
      {
        id: '5-5',
        name: 'Leather Gloves',
        category: 'accessory',
        image: 'https://images.unsplash.com/photo-1531873984533-9c1a32a93a47?w=600',
      },
    ],
  },
  {
    id: '6',
    title: 'Crisp Whites',
    tag: 'Smart Casual',
    clothes: [
      {
        id: '6-1',
        name: 'White Shirt',
        category: 'top',
        image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?w=600',
      },
      {
        id: '6-2',
        name: 'Beige Chinos',
        category: 'bottom',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600',
      },
      {
        id: '6-3',
        name: 'Loafers',
        category: 'shoes',
        image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600',
      },
      {
        id: '6-4',
        name: 'Watch',
        category: 'accessory',
        image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600',
      },
    ],
  },
];

type Tab = 'all' | 'favorites';

const groupByCategory = (clothes: Cloth[]) => {
  const order: ClothCategory[] = ['top', 'bottom', 'shoes', 'bag', 'accessory', 'headwear'];
  const map = new Map<ClothCategory, Cloth[]>();
  clothes.forEach((c) => {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c);
  });
  return order.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
};

export default function OutfitsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['2', '5']));

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visible = tab === 'all' ? LOOKS : LOOKS.filter((o) => favorites.has(o.id));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1>Outfits</h1>
            <p>Your wardrobe inspiration board</p>
          </div>
          <div className={styles.tabs} role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'all'}
              className={`${styles.tab} ${tab === 'all' ? styles.tabActive : ''}`}
              onClick={() => setTab('all')}
            >
              All Looks
            </button>
            <button
              role="tab"
              aria-selected={tab === 'favorites'}
              className={`${styles.tab} ${tab === 'favorites' ? styles.tabActive : ''}`}
              onClick={() => setTab('favorites')}
            >
              Favorites
            </button>
          </div>
        </header>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <strong>No favorites yet</strong>
            Tap the heart on any look to save it here.
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((look) => {
              const isFav = favorites.has(look.id);
              const groups = groupByCategory(look.clothes);
              const [hero, ...rest] = groups;
              const heroItem = hero?.items[0];
              const heroExtra = hero ? hero.items.length - 1 : 0;

              return (
                <article key={look.id} className={styles.card}>
                  <div className={styles.collage}>
                    {heroItem && (
                      <div className={styles.hero}>
                        <Image
                          src={heroItem.image}
                          alt={heroItem.name}
                          loading="lazy"
                          width={100}
                          height={100}
                        />
                        {heroExtra > 0 && <span className={styles.countBadge}>+{heroExtra}</span>}
                      </div>
                    )}
                    <div className={styles.sideCol}>
                      {rest.slice(0, 4).map((g) => {
                        const item = g.items[0];
                        const extra = g.items.length - 1;
                        return (
                          <div key={g.category} className={styles.thumb}>
                            <Image
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              width={100}
                              height={100}
                            />
                            {extra > 0 && <span className={styles.countBadgeSm}>+{extra}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
                      onClick={() => toggleFav(look.id)}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {isFav ? '♥' : '♡'}
                    </button>
                  </div>
                  <div className={styles.meta}>
                    <h3 className={styles.title}>{look.title}</h3>
                    <p className={styles.tag}>
                      {look.tag} · {look.clothes.length} items
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
