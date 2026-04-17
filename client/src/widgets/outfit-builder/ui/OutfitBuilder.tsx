'use client';

import Image from 'next/image';

import { useOutfitBuilder } from '@/features/outfit-builder/model/useOutfitBuilder';

import styles from './OutfitBuilder.module.css';

export function OutfitBuilder() {
  const vm = useOutfitBuilder();

  if (!vm.isHydrated) {
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
          Слева выбираешь вещи из гардероба, справа сразу видишь, как выглядит комплект в сборке.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.panel}>
          <h2 className={styles.panelTitle}>Список вещей</h2>
          <p className={styles.panelHint}>Каждую вещь можно добавлять в разные сохранённые образы.</p>
          <div className={styles.filterRow}>
            {vm.constants.filterOrder.map((filterValue) => (
              <button
                key={filterValue}
                type="button"
                className={styles.filterButton}
                data-active={vm.activeFilter === filterValue}
                onClick={() => vm.setActiveFilter(filterValue)}
              >
                {filterValue === 'all' ? 'Все' : vm.constants.categoryLabels[filterValue]}
              </button>
            ))}
          </div>
          <ul className={styles.itemsList}>
            {vm.filteredItems.map((item) => {
              const isSelected = vm.selected[item.category] === item.id;
              const usedCount = vm.usedCountByItem.get(item.id) ?? 0;

              return (
                <li
                  key={item.id}
                  className={styles.itemCard}
                  draggable
                  onDragStart={(event) => vm.handleDragStart(event, item)}
                  onDragEnd={() => vm.setActiveDropSlot(null)}
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
                        {vm.constants.categoryLabels[item.category]} · В образах: {usedCount}
                      </p>
                      <p className={styles.itemDescription}>{item.description}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => vm.setItemToSlot(item)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? 'В образе' : 'Добавить'}
                  </button>
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
              {vm.constants.slotOrder.map((category) => {
                const itemId = vm.selected[category];
                const item = itemId ? vm.itemsById.get(itemId) : undefined;
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
                    data-active-drop={vm.activeDropSlot === category}
                    onDragOver={(event) => {
                      event.preventDefault();
                      vm.setActiveDropSlot(category);
                    }}
                    onDragLeave={() => vm.setActiveDropSlot(null)}
                    onDrop={(event) => vm.handleDropOnSlot(event, category)}
                  >
                    <span className={styles.slotTag}>{vm.constants.categoryLabels[category]}</span>
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
            {vm.constants.slotOrder.map((category) => {
              const itemId = vm.selected[category];
              const item = itemId ? vm.itemsById.get(itemId) : undefined;

              return (
                <article key={category} className={styles.slotCard}>
                  <div className={styles.slotLabelRow}>
                    <span className={styles.slotLabel}>{vm.constants.categoryLabels[category]}</span>
                    {item ? (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => vm.removeFromSlot(category)}
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
              value={vm.outfitName}
              onChange={(event) => vm.setOutfitName(event.target.value)}
              placeholder="Например: Smart Casual Friday"
            />
            <button type="button" className={styles.saveButton} onClick={vm.saveOutfit}>
              Сохранить образ
            </button>
            {vm.message ? <p className={styles.message}>{vm.message}</p> : null}
          </div>
        </section>
      </div>

      <section className={styles.savedSection}>
        <h2 className={styles.savedTitle}>Сохранённые образы</h2>
        {vm.savedOutfits.length === 0 ? (
          <p className={styles.savedHint}>Пока пусто. Собери первый образ и сохрани его.</p>
        ) : (
          <ul className={styles.savedList}>
            {vm.savedOutfits.map((outfit) => (
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
