import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useUserStore } from './user-store';

export type SeedlingTraySlotStatus = 'empty' | 'occupied' | 'reserved';

export interface SeedlingTraySlotAssignment {
  row: number;
  column: number;
  pepperId: string;
  pepperName?: string;
  pepperVariety?: string;
  assignedAt: string;
  notes?: string | null;
  status?: Exclude<SeedlingTraySlotStatus, 'empty'>;
}

export interface SeedlingTray {
  id: string;
  userId: string;
  name: string;
  rows: number;
  columns: number;
  description?: string | null;
  location?: string | null;
  color?: string | null;
  notes?: string | null;
  slots: SeedlingTraySlotAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface SeedlingTrayInput {
  name: string;
  rows: number;
  columns: number;
  description?: string | null;
  location?: string | null;
  color?: string | null;
  notes?: string | null;
}

export interface SeedlingTrayUpdate
  extends Partial<Omit<SeedlingTray, 'id' | 'userId' | 'slots' | 'createdAt' | 'updatedAt'>> {
  rows?: number;
  columns?: number;
}

export interface AssignPepperToSlotPayload {
  trayId: string;
  row: number;
  column: number;
  pepperId: string;
  pepperName?: string;
  pepperVariety?: string;
  notes?: string | null;
  status?: Exclude<SeedlingTraySlotStatus, 'empty'>;
  assignedAt?: string;
}

const mapTraySnapshot = (snapshot: QueryDocumentSnapshot<DocumentData>): SeedlingTray => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    userId: data.userId,
    name: data.name,
    rows: data.rows,
    columns: data.columns,
    description: data.description ?? null,
    location: data.location ?? null,
    color: data.color ?? null,
    notes: data.notes ?? null,
    slots: Array.isArray(data.slots) ? (data.slots as SeedlingTraySlotAssignment[]) : [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const useSeedlingTrayStore = defineStore('seedling-trays-firestore', () => {
  const trays = ref<SeedlingTray[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const userStore = useUserStore();

  let unsubscribe: (() => void) | null = null;

  const currentUserId = computed(() => userStore.user?.uid ?? null);

  const resetState = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    trays.value = [];
    loading.value = false;
    error.value = null;
  };

  const ensureAuthenticated = () => {
    if (!currentUserId.value) {
      throw new Error('Требуется авторизация');
    }
  };

  const traysCollection = computed(() => collection(db, 'seedlingTrays'));

  const fetchTrays = async () => {
    if (loading.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      if (!currentUserId.value) {
        resetState();
        return;
      }

      const q = query(
        traysCollection.value,
        where('userId', '==', currentUserId.value),
        orderBy('createdAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      trays.value = snapshot.docs.map(mapTraySnapshot);
    } catch (e: any) {
      error.value = e.message ?? 'Ошибка загрузки кассет';
      console.error('[seedlingTrays:fetchTrays] error:', e);
    } finally {
      loading.value = false;
    }
  };

  const subscribeTrays = () => {
    if (!currentUserId.value) {
      resetState();
      return;
    }

    if (unsubscribe) {
      unsubscribe();
    }

    const q = query(
      traysCollection.value,
      where('userId', '==', currentUserId.value),
      orderBy('createdAt', 'desc'),
    );

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        trays.value = snapshot.docs.map(mapTraySnapshot);
      },
      (err) => {
        error.value = err.message ?? 'Ошибка подписки на кассеты';
        console.error('[seedlingTrays:subscribe] error:', err);
      },
    );

    return unsubscribe;
  };

  const unsubscribeTrays = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  const getTrayById = (trayId: string) => trays.value.find((tray) => tray.id === trayId);

  const getTraySlot = (trayId: string, row: number, column: number) => {
    const tray = getTrayById(trayId);
    if (!tray) return undefined;
    return tray.slots.find((slot) => slot.row === row && slot.column === column);
  };

  const findTrayByPepperId = (pepperId: string) => {
    return trays.value.find((tray) =>
      tray.slots.some((slot) => slot.pepperId === pepperId),
    );
  };

  const createTray = async (payload: SeedlingTrayInput) => {
    ensureAuthenticated();

    const now = new Date().toISOString();

    const docRef = await addDoc(traysCollection.value, {
      userId: currentUserId.value,
      name: payload.name,
      rows: payload.rows,
      columns: payload.columns,
      description: payload.description ?? null,
      location: payload.location ?? null,
      color: payload.color ?? null,
      notes: payload.notes ?? null,
      slots: [],
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  };

  const updateTray = async (trayId: string, updates: SeedlingTrayUpdate) => {
    ensureAuthenticated();

    const trayRef = doc(db, 'seedlingTrays', trayId);
    await updateDoc(trayRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteTray = async (trayId: string) => {
    ensureAuthenticated();

    await runTransaction(db, async (transaction) => {
      const trayRef = doc(db, 'seedlingTrays', trayId);
      const traySnap = await transaction.get(trayRef);
      if (!traySnap.exists()) {
        return;
      }

      const trayData = traySnap.data() as SeedlingTray;
      if (trayData.userId !== currentUserId.value) {
        throw new Error('Нет доступа к кассете');
      }

      const now = new Date().toISOString();
      const slots = Array.isArray(trayData.slots) ? trayData.slots : [];

      for (const slot of slots) {
        if (!slot.pepperId) continue;
        const pepperRef = doc(db, 'peppers', slot.pepperId);
        const pepperSnap = await transaction.get(pepperRef);
        if (pepperSnap.exists()) {
          const pepperData = pepperSnap.data() as { userId?: string };
          if (pepperData.userId === currentUserId.value) {
            transaction.update(pepperRef, {
              seedlingSlot: deleteField(),
              updatedAt: now,
            });
          }
        }
      }

      transaction.delete(trayRef);
    });
  };

  const assignPepperToSlot = async (payload: AssignPepperToSlotPayload) => {
    ensureAuthenticated();

    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const trayIdValue = String(payload.trayId);
      if (!trayIdValue) {
        throw new Error('Некорректный идентификатор кассеты');
      }
      const pepperIdValue = String(payload.pepperId);
      if (!pepperIdValue) {
        throw new Error('Некорректный идентификатор перца');
      }

      const trayRef = doc(db, 'seedlingTrays', trayIdValue);
      const traySnap = await transaction.get(trayRef);
      if (!traySnap.exists()) {
        throw new Error('Кассета не найдена');
      }

      const trayData = traySnap.data() as SeedlingTray;
      if (trayData.userId !== currentUserId.value) {
        throw new Error('Нет доступа к кассете');
      }

      const slots = Array.isArray(trayData.slots) ? [...trayData.slots] : [];
      const slotIndex = slots.findIndex(
        (slot) => slot.row === payload.row && slot.column === payload.column,
      );

      if (slotIndex !== -1 && slots[slotIndex].pepperId !== payload.pepperId) {
        throw new Error('Ячейка уже занята другим растением');
      }

      // Удаляем существующие в этой кассете записи для этого перца (на случай перемещения)
      const cleanedSlots = slots.filter((slot) => slot.pepperId !== payload.pepperId);

      const slotAssignment: SeedlingTraySlotAssignment = {
        row: payload.row,
        column: payload.column,
        pepperId: payload.pepperId,
        assignedAt: payload.assignedAt ?? now,
        notes: payload.notes ?? null,
        status: payload.status ?? 'occupied',
      };
      if (payload.pepperName) {
        slotAssignment.pepperName = payload.pepperName;
      }
      if (payload.pepperVariety) {
        slotAssignment.pepperVariety = payload.pepperVariety;
      }

      const updatedSlots = cleanedSlots.filter(
        (slot) => !(slot.row === payload.row && slot.column === payload.column),
      );
      updatedSlots.push(slotAssignment);

      const pepperRef = doc(db, 'peppers', pepperIdValue);
      const pepperSnap = await transaction.get(pepperRef);
      if (!pepperSnap.exists()) {
        throw new Error('Перец не найден');
      }
      const pepperData = pepperSnap.data() as {
        userId?: string | null;
        seedlingSlot?: { trayId?: string; row?: number; column?: number };
      };

      const isOwner = pepperData.userId === currentUserId.value;
      const canClaimOwnership = pepperData.userId == null;

      if (!isOwner && !canClaimOwnership) {
        throw new Error('Нет доступа к перцу');
      }

      const previousSlot = pepperData.seedlingSlot;
      let previousTrayRef: ReturnType<typeof doc> | null = null;
      let filteredPreviousSlots: SeedlingTraySlotAssignment[] | null = null;
      if (previousSlot?.trayId && previousSlot.trayId !== trayIdValue) {
        previousTrayRef = doc(db, 'seedlingTrays', String(previousSlot.trayId));
        const previousTraySnap = await transaction.get(previousTrayRef);
        if (previousTraySnap.exists()) {
          const previousTrayData = previousTraySnap.data() as SeedlingTray;
          if (previousTrayData.userId === currentUserId.value) {
            const previousSlots = Array.isArray(previousTrayData.slots) ? [...previousTrayData.slots] : [];
            filteredPreviousSlots = previousSlots.filter(
              (slot) =>
                !(
                  slot.pepperId === payload.pepperId &&
                  slot.row === previousSlot.row &&
                  slot.column === previousSlot.column
                ),
            );
          }
        }
      }

      transaction.update(trayRef, {
        slots: updatedSlots,
        updatedAt: now,
      });

      if (previousTrayRef && filteredPreviousSlots) {
        transaction.update(previousTrayRef, {
          slots: filteredPreviousSlots,
          updatedAt: now,
        });
      }

      const pepperUpdate: Record<string, any> = {
        seedlingSlot: {
          trayId: payload.trayId,
          trayName: trayData.name,
          row: payload.row,
          column: payload.column,
          assignedAt: payload.assignedAt ?? now,
        },
        updatedAt: now,
      };

      if (canClaimOwnership) {
        pepperUpdate.userId = currentUserId.value;
      }

      transaction.update(pepperRef, pepperUpdate);
    });
  };

  const clearSlot = async (trayId: string, row: number, column: number, pepperId?: string) => {
    ensureAuthenticated();

    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const trayRef = doc(db, 'seedlingTrays', trayId);
      const traySnap = await transaction.get(trayRef);
      if (!traySnap.exists()) {
        throw new Error('Кассета не найдена');
      }

      const trayData = traySnap.data() as SeedlingTray;
      if (trayData.userId !== currentUserId.value) {
        throw new Error('Нет доступа к кассете');
      }

      const slots = Array.isArray(trayData.slots) ? [...trayData.slots] : [];
      const slot = slots.find((s) => s.row === row && s.column === column);
      const targetPepperId = pepperId ?? slot?.pepperId;

      const updatedSlots = slots.filter((s) => !(s.row === row && s.column === column));

      let pepperRef: ReturnType<typeof doc> | null = null;
      let shouldClearPepperSlot = false;
      let shouldAssignOwnership = false;

      if (targetPepperId) {
        pepperRef = doc(db, 'peppers', targetPepperId);
        const pepperSnap = await transaction.get(pepperRef);
        if (pepperSnap.exists()) {
          const pepperData = pepperSnap.data() as { userId?: string | null };
          if (pepperData.userId === currentUserId.value) {
            shouldClearPepperSlot = true;
          } else if (pepperData.userId == null) {
            shouldClearPepperSlot = true;
            shouldAssignOwnership = true;
          }
        }
      }

      transaction.update(trayRef, {
        slots: updatedSlots,
        updatedAt: now,
      });

      if (pepperRef && shouldClearPepperSlot) {
        const pepperUpdate: Record<string, any> = {
          seedlingSlot: deleteField(),
          updatedAt: now,
        };

        if (shouldAssignOwnership) {
          pepperUpdate.userId = currentUserId.value;
        }

        transaction.update(pepperRef, pepperUpdate);
      }
    });
  };

  const movePepperWithinTray = async (
    trayId: string,
    fromRow: number,
    fromColumn: number,
    toRow: number,
    toColumn: number,
  ) => {
    const tray = getTrayById(trayId);
    if (!tray) {
      throw new Error('Кассета не найдена');
    }
    const slot = tray.slots.find((s) => s.row === fromRow && s.column === fromColumn);
    if (!slot) {
      throw new Error('Ячейка не содержит растение');
    }

    await assignPepperToSlot({
      trayId,
      row: toRow,
      column: toColumn,
      pepperId: slot.pepperId,
      pepperName: slot.pepperName,
      pepperVariety: slot.pepperVariety,
      notes: slot.notes,
      status: slot.status ?? 'occupied',
    });
  };

  const getSlotMatrix = (trayId: string) => {
    const tray = getTrayById(trayId);
    if (!tray) return [];

    const matrix: {
      row: number;
      column: number;
      status: SeedlingTraySlotStatus;
      assignment?: SeedlingTraySlotAssignment;
    }[] = [];

    for (let row = 1; row <= tray.rows; row += 1) {
      for (let column = 1; column <= tray.columns; column += 1) {
        const assignment = tray.slots.find(
          (slot) => slot.row === row && slot.column === column,
        );
        matrix.push({
          row,
          column,
          status: assignment ? assignment.status ?? 'occupied' : 'empty',
          assignment,
        });
      }
    }

    return matrix;
  };

  const $reset = () => {
    resetState();
  };

  return {
    trays,
    loading,
    error,
    currentUserId,
    fetchTrays,
    subscribeTrays,
    createTray,
    updateTray,
    deleteTray,
    assignPepperToSlot,
    clearSlot,
    movePepperWithinTray,
    getTrayById,
    getTraySlot,
    findTrayByPepperId,
    getSlotMatrix,
    unsubscribeTrays,
    $reset,
  };
});


