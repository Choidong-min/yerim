import { NextResponse } from "next/server";

type SavedDispatchItem = {
  id: number;
  order: number;
  area: string;
  name: string;
  grade?: string;
  count: number;
  forklift: boolean;
  distanceKm: number | null;
  durationMin: number | null;
  etaMin: number | null;
  startedAt?: string | null;
  unloadedAt?: string;
  unloadedBy?: string;
  unloadDone?: boolean;
  released?: boolean;
};

type MobileDispatchSlot = {
  slot: number;
  createdAt: string;
  driverName: string;
  items: SavedDispatchItem[];
  totalDistance: number;
  totalOrderCount: number;
  copyText: string;
  startedAt?: string | null;
  mobileConfirmedAt?: string;
  mobileConfirmedBy?: string;
  mobileReleasedAt?: string;
  mobileReleasedBy?: string;
};

type DispatchStore = {
  slots: MobileDispatchSlot[];
};

const globalForDispatch = globalThis as typeof globalThis & {
  __mobileDispatchStore?: DispatchStore;
};

const getStore = () => {
  if (!globalForDispatch.__mobileDispatchStore) {
    globalForDispatch.__mobileDispatchStore = { slots: [] };
  }

  return globalForDispatch.__mobileDispatchStore;
};

const getCurrentTimeText = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${month}.${day} ${hour}:${minute}`;
};

const normalizeItem = (item: any, index: number): SavedDispatchItem => {
  const unloadDone = Boolean(
    item.unloadDone ?? item.unloadedAt ?? item.unloadDoneAt,
  );
  const unloadedAt = item.unloadedAt ?? item.unloadDoneAt;
  const unloadedBy =
    item.unloadedBy ?? item.unloadDoneBy ?? item.driverName ?? item.assignedTo;

  return {
    id: Number(item.id),
    order: Number(item.order ?? index + 1),
    area: String(item.area ?? ""),
    name: String(item.name ?? item.customer ?? ""),
    grade: item.grade ? String(item.grade) : undefined,
    count: Number(item.count ?? 0),
    forklift: Boolean(item.forklift),
    distanceKm: item.distanceKm == null ? null : Number(item.distanceKm),
    durationMin: item.durationMin == null ? null : Number(item.durationMin),
    etaMin: item.etaMin == null ? null : Number(item.etaMin),
    startedAt: item.startedAt ?? null,
    unloadedAt: unloadDone && unloadedAt ? String(unloadedAt) : undefined,
    unloadedBy: unloadDone && unloadedBy ? String(unloadedBy) : undefined,
    unloadDone,
    released: Boolean(item.released),
  };
};

const normalizeSlot = (value: any): MobileDispatchSlot | null => {
  const slotNumber = Number(value?.slot);
  const driverName = String(value?.driverName ?? "").trim();
  const items = Array.isArray(value?.items) ? value.items : [];

  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 8) {
    return null;
  }

  if (!driverName || items.length === 0) {
    return null;
  }

  const normalizedItems: SavedDispatchItem[] = items.map(normalizeItem);

  return {
    slot: slotNumber,
    createdAt: String(value?.createdAt ?? getCurrentTimeText()),
    driverName,
    items: normalizedItems.sort((a, b) => a.order - b.order),
    totalDistance: Number(value?.totalDistance ?? 0),
    totalOrderCount: Number(value?.totalOrderCount ?? 0),
    copyText: String(value?.copyText ?? ""),
    startedAt: value?.startedAt ?? null,
    mobileConfirmedAt: value?.mobileConfirmedAt
      ? String(value.mobileConfirmedAt)
      : undefined,
    mobileConfirmedBy: value?.mobileConfirmedBy
      ? String(value.mobileConfirmedBy)
      : undefined,
    mobileReleasedAt: value?.mobileReleasedAt
      ? String(value.mobileReleasedAt)
      : undefined,
    mobileReleasedBy: value?.mobileReleasedBy
      ? String(value.mobileReleasedBy)
      : undefined,
  };
};

const makeCopyText = (slot: MobileDispatchSlot) => {
  if (slot.copyText) return slot.copyText;

  return slot.items
    .sort((a, b) => a.order - b.order)
    .map((item) => `${item.order}. ${item.area} ${item.name} ${item.count ?? 0}장`)
    .join("\n");
};

const recalcSlotSummary = (slot: MobileDispatchSlot): MobileDispatchSlot => {
  const items = slot.items.sort((a, b) => a.order - b.order);

  return {
    ...slot,
    items,
    totalDistance:
      Math.round(
        items.reduce((sum, item) => sum + (item.distanceKm ?? 0), 0) * 10,
      ) / 10,
    totalOrderCount: items.reduce((sum, item) => sum + (item.count ?? 0), 0),
    copyText: makeCopyText({
      ...slot,
      items,
    }),
  };
};

export async function GET() {
  const store = getStore();

  return NextResponse.json({
    slots: store.slots.sort((a, b) => a.slot - b.slot),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    const store = getStore();

    // 삭제 요청은 driverName/items가 없어도 처리되어야 하므로
    // normalizeSlot 검사보다 먼저 처리합니다.
    if (action === "removeSlot") {
      const removeSlotNumber = Number(
        body?.slot?.slot ?? body?.slotNumber ?? body?.dispatchSlot,
      );

      if (
        !Number.isInteger(removeSlotNumber) ||
        removeSlotNumber < 1 ||
        removeSlotNumber > 8
      ) {
        return NextResponse.json(
          { error: "삭제할 배차번호가 없습니다." },
          { status: 400 },
        );
      }

      store.slots = store.slots.filter(
        (slot) => slot.slot !== removeSlotNumber,
      );

      return NextResponse.json({
        ok: true,
        slots: store.slots.sort((a, b) => a.slot - b.slot),
      });
    }

    // 모바일에서 하차 완료 버튼을 눌렀을 때 PC 화면에 바로 반영되도록
    // 특정 item의 unloadDone/unloadedAt/unloadedBy 값을 서버 store에 저장합니다.
    if (action === "unloadDone") {
      const rawItem = body?.item;
      const itemSlot = Number(rawItem?.slot ?? rawItem?.dispatchSlot);
      const itemId = Number(rawItem?.id);
      const driverName = String(
        rawItem?.driverName ?? rawItem?.assignedTo ?? body?.driverName ?? "",
      ).trim();
      const nextUnloadDone = Boolean(rawItem?.unloadDone);

      if (
        !Number.isInteger(itemSlot) ||
        itemSlot < 1 ||
        itemSlot > 8 ||
        !Number.isFinite(itemId)
      ) {
        return NextResponse.json(
          { error: "하차완료 처리할 배차 정보를 찾을 수 없습니다." },
          { status: 400 },
        );
      }

      const slotIndex = store.slots.findIndex((slot) => slot.slot === itemSlot);

      if (slotIndex < 0) {
        return NextResponse.json(
          { error: "해당 배차가 서버에 없습니다." },
          { status: 404 },
        );
      }

      const currentSlot = store.slots[slotIndex];

      const nextItems = currentSlot.items.map((item) => {
        if (Number(item.id) !== itemId) return item;

        return {
          ...item,
          unloadDone: nextUnloadDone,
          unloadedAt: nextUnloadDone
            ? String(rawItem?.unloadedAt ?? rawItem?.unloadDoneAt ?? new Date().toISOString())
            : undefined,
          unloadedBy: nextUnloadDone
            ? String(rawItem?.unloadedBy ?? rawItem?.unloadDoneBy ?? driverName ?? currentSlot.driverName)
            : undefined,
        };
      });

      const nextSlot = recalcSlotSummary({
        ...currentSlot,
        items: nextItems,
      });

      store.slots[slotIndex] = nextSlot;
      store.slots.sort((a, b) => a.slot - b.slot);

      return NextResponse.json({
        ok: true,
        slot: nextSlot,
      });
    }

    // 모바일에서 출발을 눌렀을 때 PC 예상도착 기준 시간이 같이 바뀌도록 저장합니다.
    if (action === "startDispatch") {
      const items = Array.isArray(body?.items) ? body.items : [];
      const firstItem = items[0];
      const slotNumber = Number(firstItem?.slot ?? firstItem?.dispatchSlot);
      const startedAt = String(firstItem?.startedAt ?? body?.startedAt ?? new Date().toISOString());
      const driverName = String(body?.driverName ?? firstItem?.driverName ?? firstItem?.assignedTo ?? "").trim();

      if (
        !Number.isInteger(slotNumber) ||
        slotNumber < 1 ||
        slotNumber > 8
      ) {
        return NextResponse.json(
          { error: "출발 처리할 배차번호가 없습니다." },
          { status: 400 },
        );
      }

      const slotIndex = store.slots.findIndex((slot) => slot.slot === slotNumber);

      if (slotIndex < 0) {
        return NextResponse.json(
          { error: "해당 배차가 서버에 없습니다." },
          { status: 404 },
        );
      }

      const currentSlot = store.slots[slotIndex];
      const incomingItemMap = new Map(
        items.map((item: any) => [Number(item.id), item]),
      );

      const nextItems = currentSlot.items.map((item) => {
        const incomingItem = incomingItemMap.get(Number(item.id));

        return {
          ...item,
          startedAt: String(incomingItem?.startedAt ?? startedAt),
        };
      });

      const nextSlot = recalcSlotSummary({
        ...currentSlot,
        driverName: driverName || currentSlot.driverName,
        startedAt,
        items: nextItems,
      });

      store.slots[slotIndex] = nextSlot;
      store.slots.sort((a, b) => a.slot - b.slot);

      return NextResponse.json({
        ok: true,
        slot: nextSlot,
      });
    }

    // 모바일에서 배차 완료를 눌렀을 때 PC의 해당 배차를 삭제합니다.
    if (action === "completeDispatch") {
      const items = Array.isArray(body?.items) ? body.items : [];
      const firstItem = items[0];
      const slotNumber = Number(
        body?.slotNumber ?? firstItem?.slot ?? firstItem?.dispatchSlot,
      );

      if (
        !Number.isInteger(slotNumber) ||
        slotNumber < 1 ||
        slotNumber > 8
      ) {
        return NextResponse.json(
          { error: "완료 처리할 배차번호가 없습니다." },
          { status: 400 },
        );
      }

      store.slots = store.slots.filter((slot) => slot.slot !== slotNumber);

      return NextResponse.json({
        ok: true,
        slots: store.slots.sort((a, b) => a.slot - b.slot),
      });
    }

    const incomingSlot = normalizeSlot(body?.slot);

    if (!incomingSlot) {
      return NextResponse.json(
        { error: "배차 데이터가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const existingIndex = store.slots.findIndex(
      (slot) => slot.slot === incomingSlot.slot,
    );
    const existingSlot =
      existingIndex >= 0 ? store.slots[existingIndex] : undefined;

    if (action === "upsertSlot") {
      const nextSlot: MobileDispatchSlot = {
        ...incomingSlot,
        mobileConfirmedAt: undefined,
        mobileConfirmedBy: undefined,
        mobileReleasedAt: undefined,
        mobileReleasedBy: undefined,
      };

      if (existingIndex >= 0) {
        store.slots[existingIndex] = nextSlot;
      } else {
        store.slots.push(nextSlot);
      }

      store.slots.sort((a, b) => a.slot - b.slot);

      return NextResponse.json({
        ok: true,
        slot: nextSlot,
      });
    }

    if (action === "confirmSlot") {
      const confirmedSlot: MobileDispatchSlot = {
        ...(existingSlot ?? incomingSlot),
        ...incomingSlot,
        mobileConfirmedAt: getCurrentTimeText(),
        mobileConfirmedBy: incomingSlot.driverName,
        mobileReleasedAt: existingSlot?.mobileReleasedAt,
        mobileReleasedBy: existingSlot?.mobileReleasedBy,
      };

      if (existingIndex >= 0) {
        store.slots[existingIndex] = confirmedSlot;
      } else {
        store.slots.push(confirmedSlot);
      }

      store.slots.sort((a, b) => a.slot - b.slot);

      return NextResponse.json({
        ok: true,
        slot: confirmedSlot,
      });
    }

    if (action === "completeUnload") {
      const completedSlot: MobileDispatchSlot = {
        ...(existingSlot ?? incomingSlot),
        ...incomingSlot,
        mobileConfirmedAt:
          existingSlot?.mobileConfirmedAt ?? incomingSlot.mobileConfirmedAt,
        mobileConfirmedBy:
          existingSlot?.mobileConfirmedBy ?? incomingSlot.mobileConfirmedBy,
        mobileReleasedAt:
          existingSlot?.mobileReleasedAt ?? incomingSlot.mobileReleasedAt,
        mobileReleasedBy:
          existingSlot?.mobileReleasedBy ?? incomingSlot.mobileReleasedBy,
      };

      if (existingIndex >= 0) {
        store.slots[existingIndex] = completedSlot;
      } else {
        store.slots.push(completedSlot);
      }

      store.slots.sort((a, b) => a.slot - b.slot);

      return NextResponse.json({
        ok: true,
        slot: completedSlot,
      });
    }

    if (action === "releaseSlot") {
      const releasedSlot: MobileDispatchSlot = {
        ...(existingSlot ?? incomingSlot),
        ...incomingSlot,
        mobileConfirmedAt:
          existingSlot?.mobileConfirmedAt ?? incomingSlot.mobileConfirmedAt,
        mobileConfirmedBy:
          existingSlot?.mobileConfirmedBy ?? incomingSlot.mobileConfirmedBy,
        mobileReleasedAt: getCurrentTimeText(),
        mobileReleasedBy: incomingSlot.driverName,
      };

      if (existingIndex >= 0) {
        store.slots[existingIndex] = releasedSlot;
      } else {
        store.slots.push(releasedSlot);
      }

      store.slots.sort((a, b) => a.slot - b.slot);

      return NextResponse.json({
        ok: true,
        slot: releasedSlot,
      });
    }

    return NextResponse.json(
      { error: "지원하지 않는 요청입니다." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: "배차 처리 실패" },
      { status: 500 },
    );
  }
}
