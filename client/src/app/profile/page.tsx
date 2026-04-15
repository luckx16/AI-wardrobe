'use client';

import React, { useMemo, useState } from 'react';

import { SidebarNav } from '@/shared/ui';
import { useAppSelector } from '@/shared/hooks';

import { AppearanceAnalysis } from './ui/AppearanceAnalysis/AppearanceAnalysis';
import { BodyGeometry } from './ui/BodyGeometry/BodyGeometry';
import { PersonalProfile } from './ui/PersonalProfile/PersonalProfile';
import { StylePreferences } from './ui/StylePreferences/StylePreferences';

import styles from './profilePage.module.css';

export default function ProfilePage(): React.JSX.Element {
  // Имя берём из стора, но даём редактировать локально (пока без сохранения на сервер).
  const user = useAppSelector((state) => state.user.user);
  const [displayName, setDisplayName] = useState<string>(user?.name ?? '');

  // Нужен для подсветки активного пункта навигации при клике по якорям.
  const [activeSection, setActiveSection] = useState<'personal' | 'appearance' | 'measurements' | 'style'>(
    'personal',
  );

  const navItems = useMemo(
    () => [
      // Якорные ссылки на секции страницы. Подсветка управляется `activeSection`.
      { key: 'personal', label: 'Личные данные', href: '#personal', active: activeSection === 'personal' },
      { key: 'appearance', label: 'Анализ внешности', href: '#appearance', active: activeSection === 'appearance' },
      { key: 'measurements', label: 'Измерения', href: '#measurements', active: activeSection === 'measurements' },
      { key: 'style', label: 'Предпочтения', href: '#style', active: activeSection === 'style' },
    ],
    [activeSection],
  );

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <div className={styles.userAvatar} aria-hidden="true" />
            <div>
              <p className={styles.userName}>{displayName || 'Пользователь'}</p>
              <p className={styles.userSub}>Это ваш профиль</p>
            </div>
          </div>

          <SidebarNav
            title="Навигация"
            items={navItems}
            // Для якорей используем штатный переход по `href`, а тут — только подсветка активного пункта.
            onItemClick={(key) => setActiveSection(key as typeof activeSection)}
          />
        </aside>

        <section className={styles.main} aria-label="Профиль">
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Профиль</h1>
          </div>

          <div className={styles.stack}>
            <section id="personal" className={styles.anchorSection} aria-label="Личные данные">
              <PersonalProfile name={displayName} onNameChange={setDisplayName} />
            </section>
            <section id="appearance" className={styles.anchorSection} aria-label="Анализ внешности">
              <AppearanceAnalysis />
            </section>
            <section id="measurements" className={styles.anchorSection} aria-label="Измерения">
              <BodyGeometry />
            </section>
            <section id="style" className={styles.anchorSection} aria-label="Предпочтения">
              <StylePreferences />
            </section>
          </div>

          <div className={styles.footerActions}>
            <button type="button" className={styles.secondaryBtn}>
              Отменить
            </button>
            <button type="button" className={styles.primaryBtn}>
              Сохранить
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

