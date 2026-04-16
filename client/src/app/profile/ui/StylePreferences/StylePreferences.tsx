'use client';

import React, { useCallback, useMemo, useState } from 'react';

import formStyles from '@/shared/styles/form.module.css';
import { Card } from '@/shared/ui';

import styles from './StylePreferences.module.css';

type Chip = { id: string; text: string };

function normalizeChipText(raw: string): string {
  // Нормализация нужна, чтобы не добавлять "пустые" и странно-отформатированные элементы.
  return raw.trim().replace(/\s+/g, ' ');
}

function makeId(prefix: string): string {
  // Идентификатор только для React key и удаления элементов (не для бэкенда).
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ChipInputProps = {
  label: string;
  placeholder: string;
  tone?: 'normal' | 'danger';
  value: string;
  items: Chip[];
  onValueChange: (next: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  inputId: string;
};

function ChipInput({
  label,
  placeholder,
  tone,
  value,
  items,
  onValueChange,
  onAdd,
  onRemove,
  inputId,
}: ChipInputProps): React.JSX.Element {
  // Блокируем добавление, если поле пустое/из пробелов.
  const canAdd = !!normalizeChipText(value);

  return (
    <div className={`${styles.group}${tone === 'danger' ? ` ${styles.bad}` : ''}`}>
      <p className={styles.groupTitle}>{label}</p>

      <div className={styles.addRow}>
        <input
          id={inputId}
          className={`${formStyles.input} ${styles.addInput}`}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Добавление по Enter — такой же сценарий, как клик по кнопке.
              onAdd();
            }
          }}
        />
        <button
          type="button"
          className={`${formStyles.btnGhost} ${formStyles.btnSmall}`}
          onClick={onAdd}
          disabled={!canAdd}
        >
          Добавить
        </button>
      </div>

      {items.length ? (
        <div className={styles.chips} aria-label={label}>
          {items.map((it) => (
            <span key={it.id} className={styles.chip}>
              <span className={styles.chipText}>{it.text}</span>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label="Удалить"
                onClick={() => onRemove(it.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type StylePreferencesProps = {
  wishes: string;
  prefs: Chip[];
  dislikes: Chip[];
  additions: Chip[];
  onWishesChange: (next: string) => void;
  onPrefsChange: (next: Chip[]) => void;
  onDislikesChange: (next: Chip[]) => void;
  onAdditionsChange: (next: Chip[]) => void;
};

export function StylePreferences({
  wishes,
  prefs,
  dislikes,
  additions,
  onWishesChange,
  onPrefsChange,
  onDislikesChange,
  onAdditionsChange,
}: StylePreferencesProps): React.JSX.Element {
  // Инпуты добавления — локальный стейт, а сами значения профиля храним в родителе.
  const [essentialsValue, setEssentialsValue] = useState('');
  const [noGoValue, setNoGoValue] = useState('');
  const [constraintsValue, setConstraintsValue] = useState('');

  const canAddEssentials = useMemo(() => !!normalizeChipText(essentialsValue), [essentialsValue]);
  const canAddNoGo = useMemo(() => !!normalizeChipText(noGoValue), [noGoValue]);
  const canAddConstraints = useMemo(() => !!normalizeChipText(constraintsValue), [constraintsValue]);

  const addEssential = useCallback(() => {
    const text = normalizeChipText(essentialsValue);
    if (!text) return;
    onPrefsChange([{ id: makeId('ess'), text }, ...prefs]);
    setEssentialsValue('');
  }, [essentialsValue, onPrefsChange, prefs]);

  const addNoGo = useCallback(() => {
    const text = normalizeChipText(noGoValue);
    if (!text) return;
    onDislikesChange([{ id: makeId('nogo'), text }, ...dislikes]);
    setNoGoValue('');
  }, [dislikes, noGoValue, onDislikesChange]);

  const addConstraint = useCallback(() => {
    const text = normalizeChipText(constraintsValue);
    if (!text) return;
    onAdditionsChange([{ id: makeId('con'), text }, ...additions]);
    setConstraintsValue('');
  }, [additions, constraintsValue, onAdditionsChange]);

  return (
    <Card
      title="Предпочтения"
      description="Заполните предпочтения — так AI-помощник сможет предложить более подходящие образы."
    >
      <div className={styles.wrap}>
        <div className={styles.note}>
          <label className={styles.noteTitle} htmlFor="profile-style-notes">
            Что в своей внешности вам хотелось бы подчеркнуть, а что, наоборот, скрыть?
          </label>
          <textarea
            id="profile-style-notes"
            name="styleNotes"
            className={`${formStyles.textarea} ${styles.textarea}`}
            placeholder="Например: подчеркнуть ноги, скрыть живот, выглядеть выше"
            value={wishes}
            onChange={(e) => onWishesChange(e.target.value)}
          />
        </div>

        <div className={styles.grid}>
          <ChipInput
            inputId="profile-style-essentials"
            label="База (что нравится)"
            placeholder="Например: спорт-шик"
            value={essentialsValue}
            items={prefs}
            onValueChange={setEssentialsValue}
            onAdd={addEssential}
            onRemove={(id) => onPrefsChange(prefs.filter((x) => x.id !== id))}
          />
          <ChipInput
            inputId="profile-style-nogo"
            label="Никогда не предлагать"
            placeholder="Например: жёлтый цвет"
            tone="danger"
            value={noGoValue}
            items={dislikes}
            onValueChange={setNoGoValue}
            onAdd={addNoGo}
            onRemove={(id) => onDislikesChange(dislikes.filter((x) => x.id !== id))}
          />
        </div>

        <div className={styles.constraints}>
          <label className={styles.constraintsTitle} htmlFor="profile-style-constraints">
            Дополнительные пожелания и индивидуальные особенности
          </label>

          <div className={styles.addRow}>
            <input
              id="profile-style-constraints"
              className={`${formStyles.input} ${styles.addInput}`}
              type="text"
              placeholder="Передвигаюсь на машине, поэтому почти не ношу тёплую одежду"
              value={constraintsValue}
              onChange={(e) => setConstraintsValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addConstraint();
                }
              }}
            />
            <button
              type="button"
              className={`${formStyles.btnGhost} ${formStyles.btnSmall}`}
              onClick={addConstraint}
              disabled={!canAddConstraints}
            >
              Добавить
            </button>
          </div>

          {additions.length ? (
            <div className={styles.chips} aria-label="Дополнительные пожелания">
              {additions.map((it) => (
                <span key={it.id} className={styles.chip}>
                  <span className={styles.chipText}>{it.text}</span>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    aria-label="Удалить"
                    onClick={() => onAdditionsChange(additions.filter((x) => x.id !== it.id))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

