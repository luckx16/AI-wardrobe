'use client';

import Image from 'next/image';
import { useMemo } from 'react';

import clsx from 'clsx';
import { X } from 'lucide-react';

import { ClothingSection, IClothFromDb } from '@/entities/cloth';
import { useOutfitBuilder } from '@/features/cloth/model/useOutfitBuilder';
import { getImgSrc } from '@/shared/lib/getImgSrc';

import styles from './LookBuilder.module.css';

export function LookBuilder({ lookId }: { lookId?: string }) {
  const {
    filledSectionsState,
    activeFilter,
    setActiveFilter,
    filteredClothes,
    clothCountUsedInLooksMap,
    handleDragStart,
    handleDropOnSlot,
    activeDropSlot,
    setClothToSelected,
    setActiveDropSlot,
    clothesMap,
    removeClothFromSelected,
    lookName,
    setLookName,
    message,
    saveLook,
    looks,
    editedLook,
  } = useOutfitBuilder(lookId);

  const sectionsIdsArr = useMemo(
    () => ['all', ...Object.keys(filledSectionsState)] as ('all' | ClothingSection)[],
    [filledSectionsState],
  );
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Outfit Builder:</p>
        <h1 className={styles.title}>
          {editedLook ? 'Измени' : 'Собери'} образ из вещей гардероба
        </h1>
        <p className={styles.subtitle}>
          Слева выбираешь вещи из гардероба, справа сразу видишь, как выглядит комплект в сборке.
        </p>
      </header>

      <div className={styles.layout}>
        {/* ------------------------ clothes list  ------------------------*/}
        <aside className={styles.panel}>
          <h2 className={styles.panelTitle}>Список вещей</h2>
          <p className={styles.panelHint}>
            Каждую вещь можно добавлять в разные сохранённые образы.
          </p>
          <div className={styles.filterRow}>
            {sectionsIdsArr.map((sectionId) => (
              <button
                key={sectionId}
                type="button"
                className={styles.filterButton}
                data-active={activeFilter === sectionId}
                onClick={() => setActiveFilter(sectionId)}
              >
                {sectionId}
              </button>
            ))}
          </div>
          <ul className={styles.itemsList}>
            {filteredClothes.map((item) => {
              const src = getImgSrc(item.image);
              if (!src) return null;
              const isSelected = filledSectionsState[item.section].has(item.id);
              const usedCount = clothCountUsedInLooksMap.get(item.id) ?? 0;

              return (
                <li
                  key={item.id}
                  className={styles.itemCard}
                  draggable
                  onDragStart={(event) => handleDragStart(event, item)}
                  onDragEnd={() => setActiveDropSlot(null)}
                >
                  <div className={styles.itemMain}>
                    {item.image ? (
                      <Image
                        src={src}
                        alt={item.title}
                        width={44}
                        height={44}
                        className={styles.itemImage}
                        unoptimized
                      />
                    ) : (
                      <span className={styles.itemIcon} aria-hidden="true">
                        {item.section}
                      </span>
                    )}
                    <span className={styles.color} style={{ backgroundColor: item.color }} />
                    <div>
                      <p className={styles.itemName}>{item.title}</p>
                      <p className={styles.itemMeta}>· В образах: {usedCount}</p>
                      <p className={styles.itemDescription}>{item.brand}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setClothToSelected(item)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? 'В образе' : 'Добавить'}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        {/* ------------------------ mannequin  ------------------------*/}
        <section className={styles.canvasSection}>
          <div className={styles.canvasHeader}>
            <h2 className={styles.panelTitle}>Холст образа</h2>
            <p className={styles.panelHint}>Манекен собирает образ по слоям: верх, низ и обувь.</p>
          </div>

          <div className={styles.mannequin}>
            <div className={styles.head} />
            <div className={styles.body}>
              {sectionsIdsArr.map((sectionId) => {
                if (sectionId === 'all') return null;

                const clothesInSectionArr = [...filledSectionsState[sectionId]]
                  .map((clothId) => clothesMap.get(clothId))
                  .filter(Boolean) as IClothFromDb[];

                const slotClassName =
                  sectionId === 'top'
                    ? styles.mannequinTop
                    : sectionId === 'bottom'
                      ? styles.mannequinBottom
                      : styles.mannequinShoes;

                return (
                  <div
                    key={sectionId}
                    className={clsx(
                      styles.mannequinSlot,
                      slotClassName,
                      sectionId === 'accessory' && styles.leftSlot,
                      sectionId === 'bags' && styles.rightSlot,
                    )}
                    data-active-drop={activeDropSlot === sectionId}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setActiveDropSlot(sectionId);
                    }}
                    onDragLeave={() => setActiveDropSlot(null)}
                    onDrop={(event) => handleDropOnSlot(event, sectionId)}
                  >
                    <span className={styles.slotTag}>{sectionId}</span>
                    {clothesInSectionArr.map((clothOfSection) => {
                      const src = getImgSrc(clothOfSection.image);
                      if (!src) return;
                      return (
                        <div key={clothOfSection.id} className={styles.mannequinItem}>
                          {clothOfSection.image ? (
                            <div className={styles.mannequinPhotoFrame}>
                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() =>
                                  removeClothFromSelected(sectionId, clothOfSection.id)
                                }
                              >
                                <X size={16} />
                              </button>
                              <Image
                                src={src}
                                alt={clothOfSection.title}
                                width={220}
                                height={140}
                                className={styles.mannequinImage}
                                unoptimized
                              />
                            </div>
                          ) : (
                            <span className={styles.mannequinItemIcon}>{clothOfSection.brand}</span>
                          )}
                          <span>{clothOfSection.title}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.saveBlock}>
            <label className={styles.label} htmlFor="outfit-name">
              Название образа
            </label>
            <input
              id="outfit-name"
              className={styles.input}
              value={lookName}
              onChange={(event) => setLookName(event.target.value)}
              placeholder="Например: Smart Casual Friday"
            />
            <button type="button" className={styles.saveButton} onClick={saveLook}>
              {editedLook ? 'Изменить' : 'Сохранить'} образ
            </button>
            {message ? <p className={styles.message}>{message}</p> : null}
          </div>
        </section>
      </div>

      <section className={styles.savedSection}>
        <h2 className={styles.savedTitle}>Сохранённые образы</h2>
        {looks.length === 0 ? (
          <p className={styles.savedHint}>Пока пусто. Собери первый образ и сохрани его.</p>
        ) : (
          <ul className={styles.savedList}>
            {looks.map((look) => (
              <li key={look.id} className={styles.savedCard}>
                <p className={styles.savedName}>{look.title}</p>
                <p className={styles.savedMeta}>
                  {new Date(look.createdAt).toLocaleDateString('ru-RU')} · {look.clothes.length}{' '}
                  items
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

//  <div className={styles.canvas}>
//    {sectionsIdsArr.map((sectionId) => {
//      if (sectionId === 'all') return null;

//      const clothesInSectionArr = [...filledSectionsState[sectionId]]
//        .map((clothId) => clothesMap.get(clothId))
//        .filter(Boolean) as IClothFromDb[];

//      return (
//        <article key={sectionId} className={styles.slotCard}>
//          <div className={styles.slotLabelRow}>
//            <span className={styles.slotLabel}>{sectionId}</span>
//            {clothesInSectionArr.map((clothOfSection) => {
//              return (
//                <Fragment key={clothOfSection.id}>
//                  <button
//                    type="button"
//                    className={styles.removeButton}
//                    onClick={() => removeClothFromSelected(sectionId, clothOfSection.id)}
//                  >
//                    Убрать
//                  </button>
//                  <div className={styles.slotContent}>
//                    {clothOfSection.image ? (
//                      <Image
//                        src={clothOfSection.image}
//                        alt={clothOfSection.title}
//                        width={72}
//                        height={72}
//                        className={styles.slotPhoto}
//                        unoptimized
//                      />
//                    ) : (
//                      <span className={styles.slotFallbackIcon}>{clothOfSection.category}</span>
//                    )}
//                    <span
//                      className={styles.slotColor}
//                      style={{ backgroundColor: clothOfSection.color }}
//                    />
//                    <div>
//                      <p className={styles.slotName}>{clothOfSection.title}</p>
//                      {/* <p className={styles.slotDescription}>{clothOfSection.description}</p> */}
//                    </div>
//                  </div>
//                </Fragment>
//              );
//            })}
//          </div>
//          {clothesInSectionArr.length === 0 && (
//            <p className={styles.slotPlaceholder}>Добавь вещь из списка слева</p>
//          )}
//        </article>
//      );
//    })}
//  </div>;
