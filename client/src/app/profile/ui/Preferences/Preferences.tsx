'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Card } from '@/shared/ui';
import formStyles from '@/shared/styles/form.module.css';

import styles from './Preferences.module.css';

type Chip = { id: string; text: string };

export type PreferencesValue = {
  wishes: string;
  essentials: string[];
  noGo: string[];
  additions: string;
};

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
  disabled: boolean;
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
  disabled,
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
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Добавление по Enter — такой же сценарий, как клик по кнопке.
              if (!disabled) onAdd();
            }
          }}
        />
        <button
          type="button"
          className={`${formStyles.btnGhost} ${formStyles.btnSmall}`}
          onClick={onAdd}
          disabled={disabled || !canAdd}
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
                disabled={disabled}
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

type PreferencesProps = {
  value: PreferencesValue;
  onChange: (next: PreferencesValue) => void;
  disabled: boolean;
};

function toChips(prefix: string, items: string[]): Chip[] {
  return items.map((text, idx) => ({ id: `${prefix}-${idx}-${text}`, text }));
}

function chipsToStrings(items: Chip[]): string[] {
  return items.map((x) => x.text);
}

export function Preferences({ value, onChange, disabled }: PreferencesProps): React.JSX.Element {
  const [essentialsValue, setEssentialsValue] = useState('');
  const [noGoValue, setNoGoValue] = useState('');

  const [essentials, setEssentials] = useState<Chip[]>(() => toChips('ess', value.essentials));
  const [noGo, setNoGo] = useState<Chip[]>(() => toChips('nogo', value.noGo));

  useEffect(() => {
    setEssentials(toChips('ess', value.essentials));
  }, [value.essentials]);

  useEffect(() => {
    setNoGo(toChips('nogo', value.noGo));
  }, [value.noGo]);

  const canAddEssentials = useMemo(() => !!normalizeChipText(essentialsValue), [essentialsValue]);
  const canAddNoGo = useMemo(() => !!normalizeChipText(noGoValue), [noGoValue]);

  const addEssential = useCallback(() => {
    const text = normalizeChipText(essentialsValue);
    if (!text) return;
    setEssentials((prev) => {
      const next = [{ id: makeId('ess'), text }, ...prev];
      onChange({ ...value, essentials: chipsToStrings(next) });
      return next;
    });
    setEssentialsValue('');
  }, [essentialsValue, onChange, value]);

  const addNoGo = useCallback(() => {
    const text = normalizeChipText(noGoValue);
    if (!text) return;
    setNoGo((prev) => {
      const next = [{ id: makeId('nogo'), text }, ...prev];
      onChange({ ...value, noGo: chipsToStrings(next) });
      return next;
    });
    setNoGoValue('');
  }, [noGoValue, onChange, value]);

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
            value={value.wishes}
            onChange={(e) => onChange({ ...value, wishes: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className={styles.grid}>
          <ChipInput
            inputId="profile-style-essentials"
            label="База (что нравится)"
            placeholder="Например: спорт-шик"
            value={essentialsValue}
            items={essentials}
            onValueChange={setEssentialsValue}
            onAdd={addEssential}
            disabled={disabled}
            onRemove={(id) =>
              setEssentials((prev) => {
                const next = prev.filter((x) => x.id !== id);
                onChange({ ...value, essentials: chipsToStrings(next) });
                return next;
              })
            }
          />
          <ChipInput
            inputId="profile-style-nogo"
            label="Никогда не предлагать"
            placeholder="Например: жёлтый цвет"
            tone="danger"
            value={noGoValue}
            items={noGo}
            onValueChange={setNoGoValue}
            onAdd={addNoGo}
            disabled={disabled}
            onRemove={(id) =>
              setNoGo((prev) => {
                const next = prev.filter((x) => x.id !== id);
                onChange({ ...value, noGo: chipsToStrings(next) });
                return next;
              })
            }
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
              value={value.additions}
              onChange={(e) => onChange({ ...value, additions: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

