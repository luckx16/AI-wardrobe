'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ClothingSection, getAllClothesThunk, IClothFromDb } from '@/entities/cloth';
import { getAllLooksThunk } from '@/entities/look';
import { createLookThunk, updateLookThunk } from '@/entities/look';
import { generateLookTitle } from '@/entities/look/api/lookApi';
import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { makeUniqueTitle } from '@/shared/lib/makeUniqueTitle';

const INITIAL_FILLEDSECTIONS_STATE: Record<ClothingSection, Set<string>> = {
  headwear: new Set(),
  top: new Set(),
  accessory: new Set(),
  bags: new Set(),
  bottom: new Set(),
  shoes: new Set(),
  other: new Set(),
};

const REQUIRED_SECTIONS = ['top', 'shoes'] satisfies ClothingSection[];

export const useOutfitBuilder = (editedLookId: string | undefined) => {
  const router = useRouter();
  const pathname = usePathname();
  const [filledSectionsState, setFilledSectionsState] = useState<
    Record<ClothingSection, Set<string>>
  >(INITIAL_FILLEDSECTIONS_STATE);
  const [initializedForLookId, setInitializedForLookId] = useState<string | undefined>(undefined);

  const requiredSectionsFilled = REQUIRED_SECTIONS.every(
    (sectionId) => filledSectionsState[sectionId].size > 0,
  );

  const [lookName, setLookName] = useState('');
  const setLookNameRaw = setLookName;
  const [isLookNameDirty, setIsLookNameDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | ClothingSection>('all');
  const [activeDropSlot, setActiveDropSlot] = useState<ClothingSection | null>(null);

  const { looks } = useAppSelector((state) => state.looks);
  const { clothes } = useAppSelector((state) => state.cloth);
  const dispatch = useAppDispatch();

  const clothesMap = useMemo(() => new Map(clothes.map((cloth) => [cloth.id, cloth])), [clothes]);

  useEffect(() => {
    dispatch(getAllLooksThunk()).unwrap();
    dispatch(getAllClothesThunk()).unwrap();
  }, [dispatch]);

  useEffect(() => {
    // при выходе из режима редактирования возвращаемся в create-mode,
    // иначе isLookNameDirty остаётся true и авто-генерация названия не запускается
    if (!editedLookId) {
      setInitializedForLookId(undefined);
      setIsLookNameDirty(false);
      setLookName('');
    }
  }, [editedLookId]);

  const editedLook = editedLookId ? looks.find((l) => l.id === editedLookId) : undefined;
  if (editedLook && initializedForLookId !== editedLookId) {
    setInitializedForLookId(editedLookId);
    const sections = { ...INITIAL_FILLEDSECTIONS_STATE };
    editedLook.clothes.forEach((cloth) => {
      sections[cloth.section] = new Set([...sections[cloth.section], cloth.id]);
    });
    setFilledSectionsState(sections);
    setLookNameRaw(editedLook.title);
    setIsLookNameDirty(true);
  }

  const isCreateMode = !editedLook;

  const buildClothIdsFromState = (state: Record<ClothingSection, Set<string>>) => {
    const ids = Object.values(state)
      .map((s) => Array.from(s))
      .flat();

    return ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0);
  };

  const existingLookTitles = (() => {
    const titles = looks.map((l) => l.title).filter(Boolean);
    return editedLook ? titles.filter((t) => t !== editedLook.title) : titles;
  })();

  const lastTitleReqIdRef = useRef(0);
  const titleDebounceRef = useRef<number | null>(null);

  const requestAiTitle = (state: Record<ClothingSection, Set<string>>) => {
    if (!isCreateMode || isLookNameDirty) return;

    const clothIds = buildClothIdsFromState(state);
    if (clothIds.length === 0) {
      return;
    }
    if (clothIds.length < 2) {
      setLookNameRaw(makeUniqueTitle('Образ', existingLookTitles));
      return;
    }

    if (titleDebounceRef.current) {
      window.clearTimeout(titleDebounceRef.current);
    }

    const reqId = (lastTitleReqIdRef.current += 1);
    titleDebounceRef.current = window.setTimeout(async () => {
      try {
        const res = await generateLookTitle({ clothIds });
        if (reqId !== lastTitleReqIdRef.current) return;
        const unique = makeUniqueTitle(res.title || 'Образ', existingLookTitles);
        setLookNameRaw(unique);
      } catch {
        if (reqId !== lastTitleReqIdRef.current) return;
        // если AI недоступен/упал — всё равно подставим осмысленный дефолт
        setLookNameRaw(makeUniqueTitle('Образ', existingLookTitles));
      }
    }, 700);
  };

  useEffect(() => {
    requestAiTitle(filledSectionsState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledSectionsState, isCreateMode, isLookNameDirty]);

  const clothCountUsedInLooksMap = useMemo(() => {
    const counterMap = new Map<string, number>();

    looks.forEach((look) => {
      look.clothes.forEach((cloth) => {
        counterMap.set(cloth.id, (counterMap.get(cloth.id) ?? 0) + 1);
      });
    });

    return counterMap;
  }, [looks]);
  const filteredClothes =
    activeFilter === 'all' ? clothes : clothes.filter((item) => item.section === activeFilter);

  const setClothToSelected = (cloth: IClothFromDb) => {
    setFilledSectionsState((prev) => {
      const copy = { ...prev };
      const updatedSection = new Set(copy[cloth.section]);
      updatedSection.add(cloth.id);

      copy[cloth.section] = updatedSection;
      return copy;
    });
    setMessage(null);
  };

  const removeClothFromSelected = (sectionId: ClothingSection, clothId: string) => {
    setFilledSectionsState((prev) => {
      const copy = { ...prev };
      const updatedSection = new Set(copy[sectionId]);
      updatedSection.delete(clothId);

      copy[sectionId] = updatedSection;
      return copy;
    });
    setMessage(null);
  };

  const saveLook = async () => {
    if (!requiredSectionsFilled) {
      setMessage('Заполни обязательные слоты: верх и обувь.');
      return;
    }

    const trimmedLookName = lookName.trim();
    if (!trimmedLookName) {
      setMessage('Добавь название образа, чтобы сохранить его.');
      return;
    }

    const uniqueLookName = makeUniqueTitle(trimmedLookName, existingLookTitles);
    if (uniqueLookName !== trimmedLookName) {
      setLookName(uniqueLookName);
    }

    const clothIdsArr = Object.values(filledSectionsState)
      .map((clothSet) => Array.from(clothSet))
      .flat();

    try {
      await dispatch(
        editedLook
          ? updateLookThunk({
              id: editedLook.id,
              title: uniqueLookName,
              cloth_ids: clothIdsArr,
            })
          : createLookThunk({
              title: uniqueLookName,
              cloth_ids: clothIdsArr,
            }),
      ).unwrap();

      setLookName('');
      setIsLookNameDirty(false);
      setMessage('Образ сохранён в базе данных.');
      setFilledSectionsState(INITIAL_FILLEDSECTIONS_STATE);

      // переход в режим создания нового лука
      router.push(CLIENT_ROUTES.LOOK_BUILDER());
    } catch (error) {
      console.error('Failed to save look', error);
      setMessage('Не удалось сохранить образ в базу.');
    }
  };

  type DragTransferDataType = { clothId: string; sectionId: ClothingSection };
  const handleDragStart = (event: React.DragEvent<HTMLElement>, cloth: IClothFromDb) => {
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        clothId: cloth.id,
        sectionId: cloth.section,
      } satisfies DragTransferDataType),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (
    event: React.DragEvent<HTMLDivElement>,
    slotSection: ClothingSection,
  ) => {
    event.preventDefault();
    setActiveDropSlot(null);
    const rawData = event.dataTransfer.getData('text/plain');
    if (!rawData) {
      return;
    }

    try {
      const payload = JSON.parse(rawData) as DragTransferDataType;
      const item = clothesMap.get(payload.clothId);
      if (!item) {
        return;
      }
      if (item.section !== slotSection) {
        setMessage(`Нельзя положить "${item.title}" в слот "${slotSection}".`);
        return;
      }

      setClothToSelected(item);
      setMessage(`"${item.title}" добавлен в слот " ${slotSection}".`);
    } catch {
      setMessage('Не удалось перетащить вещь. Попробуй ещё раз.');
    }
  };

  return {
    filledSectionsState,
    lookName,
    setLookName: (v: string) => {
      setIsLookNameDirty(true);
      setLookName(v);
    },
    message,
    activeFilter,
    setActiveFilter,
    clothes,
    filteredClothes,
    clothesMap,
    clothCountUsedInLooksMap,
    activeDropSlot,
    setActiveDropSlot,
    setClothToSelected,
    removeClothFromSelected,
    saveLook,
    handleDragStart,
    handleDropOnSlot,
    looks,
    editedLook,
  };
};
