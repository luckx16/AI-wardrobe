"use client";

import { useMemo, useState } from 'react';

import type { GeneratedLook } from '../../model/types';
import { saveLook } from '../../api/lookApi';

import styles from './LookCard.module.css';

type Props = {
  generated: GeneratedLook;
};

export function LookCard({ generated }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const clothIds = useMemo(
    () =>
      generated.cloths
        .map((c) => Number(c.id))
        .filter((n) => Number.isFinite(n) && n > 0),
    [generated.cloths],
  );

  const handleSave = async () => {
    if (isSaving || savedId) return;
    setIsSaving(true);
    try {
      const saved = await saveLook({
        title: generated.look.title,
        cloth_ids: clothIds,
      });
      const id = saved?.id != null ? String(saved.id) : 'saved';
      setSavedId(id);
    } finally {
      setIsSaving(false);
    }
  };

  const meta = generated.look.metadata ?? {};
  const occasion = meta.occasion?.trim();

  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>{generated.look.title}</h3>
      </div>

      {occasion && (
        <div className={styles.meta}>
          {occasion && <div>Повод: {occasion}</div>}
        </div>
      )}

      <ul className={styles.list}>
        {generated.cloths.map((c) => (
          <li key={String(c.id)} className={styles.item}>
            <div className={styles.itemTop}>
              <span className={styles.role}>{c.role}</span>
              <span className={styles.name}>{c.title}</span>
            </div>
            {c.reason && <div className={styles.reason}>{c.reason}</div>}
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={() => void handleSave()}
          disabled={isSaving || !!savedId || clothIds.length === 0}
        >
          {savedId ? 'Сохранено' : isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}

