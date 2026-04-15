import React from 'react';

import styles from './Card.module.css';

type CardProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, description, actions, className, children }: CardProps): React.JSX.Element {
  return (
    <section className={`${styles.card}${className ? ` ${className}` : ''}`}>
      {title ? (
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{title}</h3>
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}

