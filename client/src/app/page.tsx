'use client';

import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={`${styles.badge} ${styles.animatedBadge}`}>
          Умный гардероб нового поколения
        </p>
        <h1 className={styles.heroTitle}>
          Ваш личный стилист
          <span>с искусственным интеллектом</span>
        </h1>
        <p className={styles.heroLead}>
          Управляйте гардеробом, создавайте образы и получайте ежедневные
          рекомендации от AI-стилиста - все в одном приложении.
        </p>
        <button className={styles.primaryCta}>Попробовать →</button>
      {/* <div>
        <img src="" alt="" />
      </div> */}
        
      </section>
      <section className={styles.closetSection}>
        <p className={`${styles.badge} ${styles.animatedBadge}`}>
          Цифровой гардероб
        </p>
        <h2>Зачем вам приложение для шкафа</h2>
        <p className={styles.sectionLead}>
          Управляйте коллекцией одежды так же легко, как музыкой в плейлисте.
        </p>
        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/previews/closet-1.png"
              alt="Мой гардероб"
            />
            <h3>1. Следите за тем, что у вас есть</h3>
            <p>
              Добавляйте вещи, категории и фильтры, чтобы быстро находить нужную
              одежду и не терять вещи в шкафу.
            </p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/previews/closet-2.png"
              alt="Конструктор образов"
            />
            <h3>2. Находите новые наряды</h3>
            <p>
              Экспериментируйте с сочетаниями верха, низа и обуви - AI предложит
              гармоничный образ и объяснит, почему он работает.
            </p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/previews/closet-3.png"
              alt="Список для поездки"
            />
            <h3>3. Упростите упаковку для отпуска</h3>
            <p>
              Собирайте списки вещей на любые поездки: выберите стиль и
              длительность, а приложение предложит оптимальный набор.
            </p>
          </article>
        </div>
      </section>
      <section id="why-ai" className={styles.whySection}>
        <p className={`${styles.badge} ${styles.animatedBadge}`}>AI-стилист</p>
        <h2>Зачем нужен стилист с искусственным интеллектом</h2>
        <p className={styles.sectionLead}>
          Персональные рекомендации, которые учитывают ваш стиль, погоду и
          планы.
        </p>

        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/previews/ai-stylist-1.png"
              alt="Ежедневные рекомендации AI"
            />
            <h3>1. Получайте рекомендации по одежде ежедневно</h3>
            <p>
              На основе вашего гардероба AI-стилист каждый день создает для вас
              предложения по образу, учитывая стиль, погоду и планы.
            </p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/previews/ai-stylist-2.png"
              alt="Образ для особого случая"
            />
            <h3>2. Образ для особого случая</h3>
            <p>
              Обратитесь к личному стилисту за образом для свадьбы, делового
              ужина или вечеринки - и соберите цельный look из уже имеющихся
              вещей.
            </p>
          </article>
          <article className={styles.infoCard}>
            <img
              className={styles.infoPreview}
              src="/previews/ai-stylist-3.png"
              alt="Статистика категорий гардероба"
            />
            <h3>3. Заполните пробелы в гардеробе</h3>
            <p>
              WardrobeAI поможет определить, каких вещей не хватает, чтобы
              собрать больше образов и повысить вариативность гардероба.
            </p>
          </article>
        </div>
      </section>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresInner}>
          <p className={`${styles.badge} ${styles.animatedBadge}`}>
            Возможности
          </p>
          <h2>Функции, которые вам понравятся</h2>
          <p className={styles.sectionLead}>
            Вы получаете все необходимые функции для вашего цифрового гардероба.
          </p>
          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>✨</span>
              <p>Создавайте наряды из своей одежды</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>🤳</span>
              <p>Виртуальная примерка с помощью селфи</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>💡</span>
              <p>Предложения по образу от AI</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>🗓️</span>
              <p>Составление образа под ближайшие планы</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>👥</span>
              <p>Общайтесь с друзьями и просматривайте их гардеробы</p>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBadge}>📐</span>
              <p>Вносите параметры тела для точного подбора образа</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2>Готовы упорядочить свой гардероб?</h2>
          <p>
            Присоединяйтесь к тысячам пользователей, которые уже открыли новый
            способ одеваться с помощью AI.
          </p>
          <button className={styles.primaryCta}>Начать →</button>
        </div>
      </section>

      

      <footer className={styles.footer}>
        <div className={styles.logo}>
          <span className={styles.logoBadge}>W</span>
          <span className={styles.logoText}>WardrobeAI</span>
        </div>
        <div className={styles.footerLinks}>
          <a href="#why-ai">О нас</a>
          <a href="#features">Функции</a>
        </div>
        <p>© 2026 WardrobeAI. Все права защищены.</p>
      </footer>
    </main>
  );
}
