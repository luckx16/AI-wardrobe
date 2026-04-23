'use client';

import { useRouter } from 'next/navigation';

import { useTranslation } from 'react-i18next';

import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppSelector } from '@/shared/hooks';

import styles from './page.module.css';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAppSelector((state) => state.user.user);
  const isAuthenticated = Boolean(user);

  const handleTryClick = () => {
    router.push(CLIENT_ROUTES.DASHBOARD);
  };

  const handleStartClick = () => {
    router.push(isAuthenticated ? CLIENT_ROUTES.DASHBOARD : `${CLIENT_ROUTES.AUTH}?tab=sign-up`);
  };

  return (
    <main className={styles.page} data-no-header-offset="true">
      <section className={styles.hero}>
        <p className={`${styles.badge} ${styles.animatedBadge}`}>{t('home.hero.badge')}</p>
        <h1 className={styles.heroTitle}>
          {t('home.hero.title')}
          <span>{t('home.hero.titleAccent')}</span>
        </h1>
        <p className={styles.heroLead}>{t('home.hero.lead')}</p>
        <button className={styles.primaryCta} type="button" onClick={handleTryClick}>
          {t('home.hero.try')}
        </button>
      </section>
      <section className={styles.closetSection}>
        <p className={`${styles.badge} ${styles.animatedBadge}`}>{t('home.closet.badge')}</p>
        <h2>{t('home.closet.title')}</h2>
        <p className={styles.sectionLead}>{t('home.closet.lead')}</p>
        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/home/Следите.png"
              alt={t('home.closet.cards.first.alt')}
            />
            <h3>{t('home.closet.cards.first.title')}</h3>
            <p>{t('home.closet.cards.first.text')}</p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/home/Находите.png"
              alt={t('home.closet.cards.second.alt')}
            />
            <h3>{t('home.closet.cards.second.title')}</h3>
            <p>{t('home.closet.cards.second.text')}</p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/home/рекомендации.png"
              alt={t('home.closet.cards.third.alt')}
            />
            <h3>{t('home.closet.cards.third.title')}</h3>
            <p>{t('home.closet.cards.third.text')}</p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/home/Образ.png"
              alt={t('home.closet.cards.fourth.alt')}
            />
            <h3>{t('home.closet.cards.fourth.title')}</h3>
            <p>{t('home.closet.cards.fourth.text')}</p>
          </article>
        </div>
      </section>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresInner}>
          <p className={`${styles.badge} ${styles.animatedBadge}`}>{t('home.features.badge')}</p>
          <h2>{t('home.features.title')}</h2>
          <p className={styles.sectionLead}>{t('home.features.lead')}</p>
          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>👗</span>
              <p>{t('home.features.items.0')}</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>🤖</span>
              <p>{t('home.features.items.1')}</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>💡</span>
              <p>{t('home.features.items.2')}</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>🗓️</span>
              <p>{t('home.features.items.3')}</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>🗂️</span>
              <p>{t('home.features.items.4')}</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>📊</span>
              <p>{t('home.features.items.5')}</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2>{t('home.cta.title')}</h2>
          <p>{t('home.cta.lead')}</p>
          <button className={styles.primaryCta} type="button" onClick={handleStartClick}>
            {t('home.cta.start')}
          </button>
        </div>
      </section>
    </main>
  );
}
