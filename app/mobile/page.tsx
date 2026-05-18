"use client";

import { useEffect, useState } from "react";

type Mode = "order" | "dispatchList" | "dispatch";

type RecentOrder = {
  id: string;
  name: string;
  time: string;
  text: string;
  status: "완료" | "실패";
};

type MobileDispatchItem = {
  id: number;
  order: number;
  area: string;
  customer: string;
  count: number;
  assignedTo: string;
  distanceKm: number | null;
  durationMin: number | null;
  etaMin: number | null;
  startedAt: string | null;
  unloadingMin: number;
  slot?: number;
  dispatchSlot?: number;
  driverName?: string;
  createdAt?: string;
  confirmed?: boolean;
  released?: boolean;
  unloadDone?: boolean;
};

const MOBILE_MODE_KEY = "mobile_default_mode_v1";
const RECENT_ORDER_KEY = "mobile_recent_orders_v2";
const ORDER_NAME_KEY = "mobile_order_name_v1";
const DISPATCH_NAME_KEY = "mobile_dispatch_name_v1";
const MOBILE_DISPATCH_KEY = "delivery_mobile_dispatch_v1";
const MOBILE_DISPATCH_CONFIRMED_KEY = "delivery_mobile_dispatch_confirmed_v1";
const MOBILE_UNLOAD_DONE_KEY = "delivery_mobile_unload_done_v1";
const MOBILE_DISPATCH_STARTED_KEY = "delivery_mobile_dispatch_started_v1";
const MOBILE_DISPATCH_COMPLETED_KEY = "delivery_mobile_dispatch_completed_v1";

export default function MobilePage() {
  const [mode, setMode] = useState<Mode>("order");
  const [orderText, setOrderText] = useState("");
  const [orderName, setOrderName] = useState("");
  const [dispatchName, setDispatchName] = useState("");
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [dispatchItems, setDispatchItems] = useState<MobileDispatchItem[]>([]);
  const [openedDispatchId, setOpenedDispatchId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(MOBILE_MODE_KEY) as Mode | null;
    const savedOrders = localStorage.getItem(RECENT_ORDER_KEY);
    const savedOrderName = localStorage.getItem(ORDER_NAME_KEY);
    const savedDispatchName = localStorage.getItem(DISPATCH_NAME_KEY);

    if (
      savedMode === "order" ||
      savedMode === "dispatchList" ||
      savedMode === "dispatch"
    ) {
      setMode(savedMode);
    }

    if (savedOrderName) {
      setOrderName(savedOrderName);
    }

    if (savedDispatchName) {
      setDispatchName(savedDispatchName);
    }

    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setRecentOrders(parsed);
        }
      } catch {
        localStorage.removeItem(RECENT_ORDER_KEY);
      }
    }

    loadDispatchItems();

    const timer = window.setInterval(() => {
      loadDispatchItems();
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(ORDER_NAME_KEY, orderName);
  }, [orderName]);

  useEffect(() => {
    localStorage.setItem(DISPATCH_NAME_KEY, dispatchName);
  }, [dispatchName]);

  const normalizeName = (value: string) => {
    return String(value ?? "").replace(/\s+/g, "").trim();
  };

  const readJsonArray = (key: string) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getDispatchItemKey = (item: any) => {
    const createdAt = String(item.createdAt ?? item.dispatchCreatedAt ?? "");
    const slot = Number(item.slot ?? item.dispatchSlot ?? 0);
    const id = Number(item.id ?? 0);
    return `${createdAt}-${slot}-${id}`;
  };

  const getDispatchSlotKey = (item: any) => {
    const createdAt = String(item.createdAt ?? item.dispatchCreatedAt ?? "");
    const slot = Number(item.slot ?? item.dispatchSlot ?? 0);
    return `${createdAt}-${slot}`;
  };

  const getConfirmedMap = () => {
    const confirmed = readJsonArray(MOBILE_DISPATCH_CONFIRMED_KEY);
    return new Map(
      confirmed
        .filter((item: any) => item.createdAt || item.dispatchCreatedAt)
        .map((item: any) => [getDispatchItemKey(item), true]),
    );
  };

  const getUnloadDoneMap = () => {
    const done = readJsonArray(MOBILE_UNLOAD_DONE_KEY);
    return new Map(
      done
        .filter((item: any) => item.createdAt || item.dispatchCreatedAt)
        .map((item: any) => [getDispatchItemKey(item), true]),
    );
  };

  const getStartedMap = () => {
    const started = readJsonArray(MOBILE_DISPATCH_STARTED_KEY);
    return new Map(
      started
        .filter((item: any) => item.createdAt || item.dispatchCreatedAt)
        .map((item: any) => [getDispatchSlotKey(item), String(item.startedAt ?? "")]),
    );
  };

  const getCompletedMap = () => {
    const completed = readJsonArray(MOBILE_DISPATCH_COMPLETED_KEY);
    return new Map(
      completed
        .filter((item: any) => item.createdAt || item.dispatchCreatedAt)
        .map((item: any) => [getDispatchSlotKey(item), String(item.completedAt ?? "")]),
    );
  };

  const mergeStatus = (items: MobileDispatchItem[]) => {
    const confirmedMap = getConfirmedMap();
    const unloadDoneMap = getUnloadDoneMap();
    const startedMap = getStartedMap();
    const completedMap = getCompletedMap();

    return items.map((item) => {
      const slot = Number(item.slot ?? item.dispatchSlot ?? 0);
      const key = getDispatchItemKey(item);
      const slotKey = getDispatchSlotKey(item);
      const startedAt = startedMap.get(slotKey) || item.startedAt || null;

      return {
        ...item,
        slot,
        dispatchSlot: slot,
        startedAt,
        confirmed: Boolean(item.confirmed) || confirmedMap.has(key),
        released: Boolean(item.released) || completedMap.has(slotKey),
        unloadDone: Boolean(item.unloadDone) || unloadDoneMap.has(key),
      };
    });
  };

  const normalizeDispatchItems = (raw: any): MobileDispatchItem[] => {
    let source: any[] = [];

    if (Array.isArray(raw)) {
      source = raw;
    } else if (Array.isArray(raw?.items)) {
      source = raw.items;
    } else if (Array.isArray(raw?.dispatchItems)) {
      source = raw.dispatchItems;
    } else if (Array.isArray(raw?.slots)) {
      source = raw.slots.flatMap((dispatch: any) =>
        Array.isArray(dispatch.items)
          ? dispatch.items.map((item: any) => ({
              ...item,
              slot: dispatch.slot ?? dispatch.dispatchSlot,
              dispatchSlot: dispatch.slot ?? dispatch.dispatchSlot,
              createdAt: dispatch.createdAt ?? item.createdAt,
              assignedTo:
                item.assignedTo ??
                item.driverName ??
                dispatch.driverName ??
                dispatch.assignedTo ??
                "",
              driverName:
                item.driverName ??
                item.assignedTo ??
                dispatch.driverName ??
                dispatch.assignedTo ??
                "",
              released: item.released ?? dispatch.released ?? false,
              confirmed:
                item.confirmed ??
                dispatch.confirmed ??
                Boolean(dispatch.mobileConfirmedAt),
            }))
          : [],
      );
    } else if (Array.isArray(raw?.dispatches)) {
      source = raw.dispatches.flatMap((dispatch: any) =>
        Array.isArray(dispatch.items)
          ? dispatch.items.map((item: any) => ({
              ...item,
              slot: dispatch.slot ?? dispatch.dispatchSlot,
              dispatchSlot: dispatch.slot ?? dispatch.dispatchSlot,
              createdAt: dispatch.createdAt ?? item.createdAt,
              assignedTo:
                item.assignedTo ??
                item.driverName ??
                dispatch.driverName ??
                dispatch.assignedTo ??
                "",
              driverName:
                item.driverName ??
                item.assignedTo ??
                dispatch.driverName ??
                dispatch.assignedTo ??
                "",
              released: item.released ?? dispatch.released ?? false,
              confirmed: item.confirmed ?? dispatch.confirmed ?? false,
            }))
          : [],
      );
    }

    return mergeStatus(
      source
        .filter((item: any) => item && (item.id || item.customer || item.name))
        .map((item: any, index: number) => {
          const slot = Number(item.slot ?? item.dispatchSlot ?? 0);

          return {
            id: Number(item.id ?? index + 1),
            order: Number(item.order ?? index + 1),
            area: String(item.area ?? "").replace("전남 ", ""),
            customer: String(item.customer ?? item.name ?? ""),
            count: Number(item.count ?? 0),
            assignedTo: String(
              item.assignedTo ?? item.driverName ?? item.nameOfDriver ?? "",
            ),
            driverName: String(
              item.driverName ?? item.assignedTo ?? item.nameOfDriver ?? "",
            ),
            distanceKm:
              item.distanceKm == null ? null : Number(item.distanceKm),
            durationMin:
              item.durationMin == null ? null : Number(item.durationMin),
            etaMin: item.etaMin == null ? null : Number(item.etaMin),
            startedAt: item.startedAt ?? null,
            unloadingMin: Number(item.unloadingMin ?? 15),
            slot,
            dispatchSlot: slot,
            createdAt: String(item.createdAt ?? item.dispatchCreatedAt ?? ""),
            confirmed: Boolean(item.confirmed),
            released: Boolean(item.released),
            unloadDone: Boolean(item.unloadDone),
          };
        })
        .sort(
          (a: MobileDispatchItem, b: MobileDispatchItem) =>
            (a.order ?? 0) - (b.order ?? 0),
        ),
    );
  };

  const loadDispatchItems = async () => {
    let loaded = false;

    try {
      const res = await fetch("/api/mobile-dispatch", {
        method: "GET",
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = normalizeDispatchItems(data);

        setDispatchItems(parsed);
        localStorage.setItem(MOBILE_DISPATCH_KEY, JSON.stringify(parsed));
        loaded = true;
      }
    } catch {
      // API 연결 실패 시 localStorage 기준으로 표시
    }

    if (loaded) return;

    try {
      const saved = localStorage.getItem(MOBILE_DISPATCH_KEY);
      if (!saved) {
        setDispatchItems([]);
        return;
      }

      const parsed = normalizeDispatchItems(JSON.parse(saved));
      setDispatchItems(parsed);
    } catch {
      setDispatchItems([]);
    }
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    localStorage.setItem(MOBILE_MODE_KEY, nextMode);
  };

  const saveRecentOrders = (orders: RecentOrder[]) => {
    setRecentOrders(orders);
    localStorage.setItem(RECENT_ORDER_KEY, JSON.stringify(orders));
  };

  const sendOrder = async () => {
    const text = orderText.trim();
    const name = orderName.trim();

    if (!text) {
      alert("발주 내용을 입력하세요.");
      return;
    }

    if (!name) {
      alert("이름을 입력하세요.");
      return;
    }

    if (sending) return;

    setSending(true);

    try {
      const res = await fetch("/api/mobile-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const failedOrder: RecentOrder = {
          id: `${Date.now()}-fail`,
          name,
          time: "전송실패",
          text,
          status: "실패",
        };

        saveRecentOrders([failedOrder, ...recentOrders].slice(0, 5));
        alert(data.error || "발주 전송 실패");
        return;
      }

      const completedOrder: RecentOrder = {
        id: data.order.id,
        name,
        time: data.order.createdAt,
        text,
        status: "완료",
      };

      saveRecentOrders([completedOrder, ...recentOrders].slice(0, 5));
      setOrderText("");
    } catch {
      const failedOrder: RecentOrder = {
        id: `${Date.now()}-fail`,
        name,
        time: "전송실패",
        text,
        status: "실패",
      };

      saveRecentOrders([failedOrder, ...recentOrders].slice(0, 5));
      alert("발주 전송 실패");
    } finally {
      setSending(false);
    }
  };

  const getVisibleDispatchItems = () => {
    const name = normalizeName(dispatchName);

    const base = dispatchItems.filter((item) => {
      const assigned = normalizeName(item.assignedTo || item.driverName || "");
      if (!name) return true;
      return assigned === name;
    });

    return base.sort((a, b) => {
      const slotDiff = Number(a.slot ?? 0) - Number(b.slot ?? 0);
      if (slotDiff !== 0) return slotDiff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  };

  const filteredDispatchItems = getVisibleDispatchItems();

  const openedDispatchItems = (() => {
    if (openedDispatchId == null) return filteredDispatchItems;

    const opened = dispatchItems.find((item) => item.id === openedDispatchId);
    const slot = opened?.slot ?? opened?.dispatchSlot ?? 0;
    const assigned = normalizeName(opened?.assignedTo || opened?.driverName || dispatchName);

    const sameDispatch = dispatchItems.filter((item) => {
      const itemSlot = item.slot ?? item.dispatchSlot ?? 0;
      const itemAssigned = normalizeName(item.assignedTo || item.driverName || "");

      if (slot > 0 && itemSlot > 0) return itemSlot === slot;
      if (assigned) return itemAssigned === assigned;
      return true;
    });

    return sameDispatch.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  })();

  const dispatchGroups = filteredDispatchItems.reduce(
    (groups, item) => {
      const slot = Number(item.slot ?? item.dispatchSlot ?? 0);
      const key = `${slot}-${normalizeName(item.assignedTo || item.driverName || "")}`;
      const existing = groups.find((group) => group.key === key);

      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({
          key,
          slot,
          driverName: item.assignedTo || item.driverName || "배차자 미입력",
          items: [item],
        });
      }

      return groups;
    },
    [] as {
      key: string;
      slot: number;
      driverName: string;
      items: MobileDispatchItem[];
    }[],
  );

  const confirmedDispatchItems = filteredDispatchItems.filter(
    (item) => item.confirmed,
  );

  const currentDispatchSlot = Number(
    (confirmedDispatchItems[0]?.slot ?? confirmedDispatchItems[0]?.dispatchSlot) ?? 0,
  );

  const startedAtText = confirmedDispatchItems.find((item) => item.startedAt)?.startedAt ?? null;
  const isDispatchCompleted = confirmedDispatchItems.length > 0 && confirmedDispatchItems.every((item) => item.released);

  const selectedDispatchItem =
    openedDispatchId == null
      ? null
      : dispatchItems.find((item) => item.id === openedDispatchId) ?? null;

  const formatMin = (minutes: number | null) => {
    if (minutes == null) return "미계산";
    if (minutes <= 0) return "도착/진행중";

    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;

    if (hour <= 0) return `${min}분 후`;
    if (min === 0) return `${hour}시간 후`;
    return `${hour}시간 ${min}분 후`;
  };


  const parseStartedAt = (value: string | null) => {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : null;
  };

  const formatClock = (timestamp: number) => {
    const date = new Date(timestamp);
    const hour = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${hour}:${min}`;
  };

  const formatArrivalTime = (item: MobileDispatchItem) => {
    if (item.unloadDone) return "하차완료";

    const startTime = parseStartedAt(item.startedAt ?? startedAtText);
    if (startTime == null) return "출발대기";
    if (item.etaMin == null) return "도착 미계산";

    return `${formatClock(startTime + item.etaMin * 60 * 1000)} 도착`;
  };

  const saveDispatchItemsLocal = (items: MobileDispatchItem[]) => {
    setDispatchItems(items);
    localStorage.setItem(MOBILE_DISPATCH_KEY, JSON.stringify(items));
  };


  const updateDispatchSlotItems = (
    slot: number,
    updater: (item: MobileDispatchItem) => MobileDispatchItem,
  ) => {
    const nextItems = dispatchItems.map((item) => {
      const itemSlot = Number(item.slot ?? item.dispatchSlot ?? 0);
      return itemSlot === slot ? updater(item) : item;
    });

    saveDispatchItemsLocal(nextItems);
    return nextItems;
  };

  const startDispatch = async () => {
    if (currentDispatchSlot <= 0) {
      alert("출발할 배차가 없습니다.");
      return;
    }

    const startedAt = new Date().toISOString();
    const currentDispatchCreatedAt = confirmedDispatchItems[0]?.createdAt ?? "";
    const savedStarted = readJsonArray(MOBILE_DISPATCH_STARTED_KEY).filter(
      (item: any) => getDispatchSlotKey(item) !== `${currentDispatchCreatedAt}-${currentDispatchSlot}`,
    );

    localStorage.setItem(
      MOBILE_DISPATCH_STARTED_KEY,
      JSON.stringify([
        {
          slot: currentDispatchSlot,
          dispatchSlot: currentDispatchSlot,
          startedAt,
          createdAt: currentDispatchCreatedAt,
          driverName: dispatchName.trim(),
        },
        ...savedStarted,
      ]),
    );

    const nextItems = updateDispatchSlotItems(currentDispatchSlot, (item) => ({
      ...item,
      startedAt,
    }));

    try {
      await fetch("/api/mobile-dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "startDispatch",
          driverName: dispatchName.trim(),
          items: nextItems.filter(
            (item) => Number(item.slot ?? item.dispatchSlot ?? 0) === currentDispatchSlot,
          ),
        }),
      });
    } catch {
      // API 실패 시 localStorage 기준으로 유지
    }
  };

  const completeDispatch = async () => {
    if (currentDispatchSlot <= 0) {
      alert("완료할 배차가 없습니다.");
      return;
    }

    const currentDispatchCreatedAt = confirmedDispatchItems[0]?.createdAt ?? "";
    const currentSlotKey = `${currentDispatchCreatedAt}-${currentDispatchSlot}`;

    // 모바일에서 완료를 누르면 해당 배차는 모바일 배차창에서 즉시 삭제합니다.
    // PC/모바일 동기화 충돌을 막기 위해 관련 localStorage 상태도 같이 정리합니다.
    const remainingItems = dispatchItems.filter(
      (item) => Number(item.slot ?? item.dispatchSlot ?? 0) !== currentDispatchSlot,
    );

    saveDispatchItemsLocal(remainingItems);

    localStorage.setItem(
      MOBILE_DISPATCH_CONFIRMED_KEY,
      JSON.stringify(
        readJsonArray(MOBILE_DISPATCH_CONFIRMED_KEY).filter(
          (item: any) => getDispatchSlotKey(item) !== currentSlotKey,
        ),
      ),
    );

    localStorage.setItem(
      MOBILE_UNLOAD_DONE_KEY,
      JSON.stringify(
        readJsonArray(MOBILE_UNLOAD_DONE_KEY).filter(
          (item: any) => getDispatchSlotKey(item) !== currentSlotKey,
        ),
      ),
    );

    localStorage.setItem(
      MOBILE_DISPATCH_STARTED_KEY,
      JSON.stringify(
        readJsonArray(MOBILE_DISPATCH_STARTED_KEY).filter(
          (item: any) => getDispatchSlotKey(item) !== currentSlotKey,
        ),
      ),
    );

    localStorage.setItem(
      MOBILE_DISPATCH_COMPLETED_KEY,
      JSON.stringify(
        readJsonArray(MOBILE_DISPATCH_COMPLETED_KEY).filter(
          (item: any) => getDispatchSlotKey(item) !== currentSlotKey,
        ),
      ),
    );

    setOpenedDispatchId(null);

    try {
      await fetch("/api/mobile-dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "removeSlot",
          slotNumber: currentDispatchSlot,
        }),
      });
    } catch {
      // API 실패 시에도 모바일 화면에서는 삭제된 상태를 유지
    }

    alert("배차 완료 처리했습니다.");
  };

  const reorderDispatchItems = (targetId: number) => {
    if (draggedId == null || draggedId === targetId) return;

    const currentItems = [...dispatchItems];
    const draggedItem = currentItems.find((item) => item.id === draggedId);
    const targetItem = currentItems.find((item) => item.id === targetId);

    if (!draggedItem || !targetItem) {
      setDraggedId(null);
      return;
    }

    const draggedSlot = draggedItem.slot ?? draggedItem.dispatchSlot ?? 0;
    const targetSlot = targetItem.slot ?? targetItem.dispatchSlot ?? 0;
    const draggedName = normalizeName(draggedItem.assignedTo || draggedItem.driverName || "");
    const targetName = normalizeName(targetItem.assignedTo || targetItem.driverName || "");

    if (draggedSlot !== targetSlot || draggedName !== targetName) {
      setDraggedId(null);
      return;
    }

    const group = currentItems
      .filter((item) => {
        const itemSlot = item.slot ?? item.dispatchSlot ?? 0;
        const itemName = normalizeName(item.assignedTo || item.driverName || "");
        return itemSlot === targetSlot && itemName === targetName;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const fromIndex = group.findIndex((item) => item.id === draggedId);
    const toIndex = group.findIndex((item) => item.id === targetId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggedId(null);
      return;
    }

    const reorderedGroup = [...group];
    const [moved] = reorderedGroup.splice(fromIndex, 1);
    reorderedGroup.splice(toIndex, 0, moved);

    const orderMap = new Map(
      reorderedGroup.map((item, index) => [
        item.id,
        {
          ...item,
          order: index + 1,
        },
      ]),
    );

    const nextItems = currentItems.map((item) => orderMap.get(item.id) ?? item);
    saveDispatchItemsLocal(nextItems);
    setDraggedId(null);
  };

  const confirmDispatch = async () => {
    const name = dispatchName.trim();

    if (!name) {
      alert("이름을 입력하세요.");
      return;
    }

    const targetItems = openedDispatchItems.length > 0 ? openedDispatchItems : filteredDispatchItems;

    if (targetItems.length === 0) {
      alert("확인할 배차목록이 없습니다.");
      return;
    }

    const confirmedAt = new Date().toISOString();
    const firstTarget = targetItems[0];
    const currentSlot = Number(firstTarget?.slot ?? firstTarget?.dispatchSlot ?? 0);
    const currentCreatedAt = String(firstTarget?.createdAt ?? firstTarget?.dispatchCreatedAt ?? "");

    if (currentSlot <= 0) {
      alert("배차번호를 찾을 수 없습니다. PC에서 배차지정을 다시 전송하세요.");
      return;
    }

    const sameSlotItems = targetItems.filter((item) => {
      const itemSlot = Number(item.slot ?? item.dispatchSlot ?? 0);
      return itemSlot === currentSlot;
    });

    const confirmedItems = sameSlotItems.map((item, index) => ({
      ...item,
      order: index + 1,
      confirmed: true,
      confirmedAt,
      assignedTo: item.assignedTo || name,
      driverName: item.driverName || item.assignedTo || name,
      slot: currentSlot,
      dispatchSlot: currentSlot,
      createdAt: String(item.createdAt ?? item.dispatchCreatedAt ?? currentCreatedAt),
    }));

    const confirmedKeys = new Set(confirmedItems.map((item) => getDispatchItemKey(item)));

    const nextItems = dispatchItems.map((item) => {
      const key = getDispatchItemKey(item);
      const confirmed = confirmedItems.find(
        (confirmedItem) =>
          getDispatchItemKey(confirmedItem) === key ||
          (Number(confirmedItem.id) === Number(item.id) &&
            Number(confirmedItem.slot ?? confirmedItem.dispatchSlot ?? 0) ===
              Number(item.slot ?? item.dispatchSlot ?? 0) &&
            String(confirmedItem.createdAt ?? "") === String(item.createdAt ?? "")),
      );

      return confirmedKeys.has(key) && confirmed
        ? {
            ...item,
            ...confirmed,
          }
        : item;
    });

    saveDispatchItemsLocal(nextItems);

    const savedConfirmed = readJsonArray(MOBILE_DISPATCH_CONFIRMED_KEY);
    const mergedConfirmed = [
      ...confirmedItems,
      ...savedConfirmed.filter((item: any) => {
        const key = getDispatchItemKey(item);
        return !confirmedKeys.has(key);
      }),
    ];

    localStorage.setItem(
      MOBILE_DISPATCH_CONFIRMED_KEY,
      JSON.stringify(mergedConfirmed),
    );

    const confirmedSlot = {
      slot: currentSlot,
      dispatchSlot: currentSlot,
      createdAt: currentCreatedAt,
      driverName: name,
      assignedTo: name,
      items: confirmedItems,
      totalDistance:
        Math.round(
          confirmedItems.reduce((sum, item) => sum + (item.distanceKm ?? 0), 0) * 10,
        ) / 10,
      totalOrderCount: confirmedItems.reduce((sum, item) => sum + (item.count ?? 0), 0),
      copyText: confirmedItems
        .map((item) => `${item.order}. ${item.area} ${item.customer} ${item.count ?? 0}장`)
        .join("\n"),
      mobileConfirmedAt: confirmedAt,
      mobileConfirmedBy: name,
    };

    try {
      const res = await fetch("/api/mobile-dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "confirmSlot",
          driverName: name,
          slot: confirmedSlot,
          items: confirmedItems,
        }),
      });

      if (!res.ok) {
        alert("배차확인 전송 실패. PC와 같은 주소로 접속했는지 확인하세요.");
        return;
      }
    } catch {
      alert("배차확인 전송 실패. 서버 연결을 확인하세요.");
      return;
    }

    await loadDispatchItems();
    setOpenedDispatchId(confirmedItems[0]?.id ?? openedDispatchId);
    changeMode("dispatch");
    alert(`${name} 배차 확인 완료`);
  };

  const toggleUnloadDone = async (target: MobileDispatchItem) => {
    const slot = Number(target.slot ?? target.dispatchSlot ?? 0);
    const key = getDispatchItemKey(target);
    const nextDone = !target.unloadDone;

    const nextItems = dispatchItems.map((item) => {
      const itemKey = getDispatchItemKey(item);

      return itemKey === key
        ? {
            ...item,
            unloadDone: nextDone,
          }
        : item;
    });

    saveDispatchItemsLocal(nextItems);

    const savedDone = readJsonArray(MOBILE_UNLOAD_DONE_KEY);
    const withoutTarget = savedDone.filter((item: any) => {
      const itemKey = getDispatchItemKey(item);
      return itemKey !== key;
    });

    const nextDoneList = nextDone
      ? [
          {
            ...target,
            slot,
            dispatchSlot: slot,
            unloadDone: true,
            unloadDoneAt: new Date().toISOString(),
          },
          ...withoutTarget,
        ]
      : withoutTarget;

    localStorage.setItem(MOBILE_UNLOAD_DONE_KEY, JSON.stringify(nextDoneList));

    try {
      await fetch("/api/mobile-dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "unloadDone",
          item: {
            ...target,
            slot,
            dispatchSlot: slot,
            unloadDone: nextDone,
            unloadDoneAt: new Date().toISOString(),
          },
        }),
      });
    } catch {
      // API 실패 시 localStorage 기준으로 유지
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.phone}>
        {mode === "order" ? (
          <section style={styles.content}>
            <div style={styles.title}>발주 등록</div>

            <textarea
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              placeholder="카톡 내용을 붙여넣거나 직접 입력하세요"
              style={styles.textarea}
            />

            <div style={styles.nameBox}>
              <span style={styles.icon}>⌾</span>
              <input
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="이름을 입력하세요"
                style={styles.input}
              />
            </div>

            <button
              onClick={sendOrder}
              style={{
                ...styles.actionButton,
                ...(sending ? styles.actionButtonDisabled : {}),
              }}
              disabled={sending}
            >
              <span style={styles.actionIcon}>➤</span>
              {sending ? "전송 중..." : "발주 전송"}
            </button>

            {recentOrders.length > 0 && (
              <div style={styles.recentBox}>
                {recentOrders.map((item) => (
                  <div key={item.id} style={styles.recentItem}>
                    <div style={styles.recentHeader}>
                      <span>
                        {item.time} {item.name}
                      </span>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(item.status === "완료"
                            ? styles.statusDone
                            : styles.statusFail),
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div style={styles.recentText}>{item.text}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : mode === "dispatchList" ? (
          <section style={styles.content}>
            <div style={styles.title}>배차목록</div>

            <div style={styles.nameBox}>
              <span style={styles.icon}>⌾</span>
              <input
                value={dispatchName}
                onChange={(e) => setDispatchName(e.target.value)}
                placeholder="이름을 입력하세요"
                style={styles.input}
              />
            </div>

            <div style={styles.dispatchList}>
              {filteredDispatchItems.length === 0 ? (
                <div style={styles.emptyText}>
                  {dispatchName.trim()
                    ? "해당 이름으로 지정된 배차가 없습니다."
                    : "배차자 이름을 입력하면 지정된 배차목록을 볼 수 있습니다."}
                </div>
              ) : (
                <>
                  <div style={styles.dispatchBoxRow}>
                    {dispatchGroups.map((group) => {
                      const firstItem = group.items[0];
                      const isActive = openedDispatchItems.some(
                        (item) => Number(item.slot ?? item.dispatchSlot ?? 0) === group.slot,
                      );

                      return (
                        <button
                          key={group.key}
                          onClick={() => {
                            setOpenedDispatchId(firstItem?.id ?? null);
                          }}
                          style={{
                            ...styles.dispatchBox,
                            ...(isActive ? styles.dispatchBoxActive : {}),
                            ...(group.items.every((item) => item.confirmed)
                              ? styles.dispatchBoxConfirmed
                              : {}),
                          }}
                        >
                          <div style={styles.dispatchBoxTitle}>
                            배차{group.slot || "-"}
                          </div>
                          <div style={styles.dispatchBoxName}>{group.driverName}</div>
                          <div style={styles.dispatchBoxSub}>{group.items.length}곳</div>
                        </button>
                      );
                    })}
                  </div>

                  {openedDispatchItems.length > 0 && (
                    <div style={styles.dispatchDetail}>
                      {openedDispatchItems.map((item) => (
                        <div
                          key={`list-${item.slot ?? 0}-${item.id}-${item.order}`}
                          style={styles.detailMiniCard}
                          draggable
                          onDragStart={() => setDraggedId(item.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => reorderDispatchItems(item.id)}
                        >
                          {item.order}. {item.area} {item.customer}{" "}
                          {item.count ?? 0}장 / {formatMin(item.etaMin)}
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={confirmDispatch} style={styles.actionButton}>
                    <span style={styles.actionIcon}>➤</span>
                    배차 확인
                  </button>
                </>
              )}
            </div>
          </section>
        ) : (
          <section style={styles.content}>
            <div style={styles.nameBox}>
              <span style={styles.icon}>⌾</span>
              <input
                value={dispatchName}
                onChange={(e) => setDispatchName(e.target.value)}
                placeholder="이름을 입력하세요"
                style={styles.input}
              />
            </div>

            <div style={styles.dispatchList}>
              <div style={styles.dispatchTitle}>배차 목록</div>

              {confirmedDispatchItems.length > 0 ? (
                <div style={styles.dispatchDetail}>
                  <button onClick={startDispatch} style={styles.startButton}>
                    {startedAtText
                      ? `출발 ${formatClock(parseStartedAt(startedAtText) ?? Date.now())}`
                      : "출발"}
                  </button>

                  {confirmedDispatchItems.map((item) => (
                    <div
                      key={`${item.slot ?? 0}-${item.id}-${item.order}`}
                      style={styles.detailMiniCard}
                    >
                      <div style={styles.detailMiniTop}>
                        <span>
                          {item.order}. {item.area} {item.customer}{" "}
                          {item.count ?? 0}장 / {formatArrivalTime(item)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUnloadDone(item);
                          }}
                          style={{
                            ...styles.unloadButton,
                            ...(item.unloadDone ? styles.unloadButtonDone : {}),
                          }}
                        >
                          {item.unloadDone ? "완료" : "하차 완료"}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button onClick={completeDispatch} style={styles.completeButton}>
                    {isDispatchCompleted ? "완료됨" : "완료"}
                  </button>
                </div>
              ) : (
                <div style={styles.emptyText}>
                  배차목록에서 배차 확인을 먼저 누르세요.
                </div>
              )}
            </div>
          </section>
        )}

        <nav style={styles.bottomNav}>
          <button
            onClick={() => changeMode("order")}
            style={{
              ...styles.navButton,
              ...(mode === "order" ? styles.navButtonActiveLeft : {}),
            }}
          >
            <span style={styles.navIcon}>{mode === "order" ? "☑" : "▢"}</span>
            발주
          </button>

          <button
            onClick={() => changeMode("dispatchList")}
            style={{
              ...styles.navButton,
              ...(mode === "dispatchList" ? styles.navButtonActiveMiddle : {}),
            }}
          >
            <span style={styles.navIcon}>
              {mode === "dispatchList" ? "☑" : "▢"}
            </span>
            배차목록
          </button>

          <button
            onClick={() => changeMode("dispatch")}
            style={{
              ...styles.navButton,
              ...(mode === "dispatch" ? styles.navButtonActiveRight : {}),
            }}
          >
            <span style={styles.navIcon}>
              {mode === "dispatch" ? "☑" : "▢"}
            </span>
            배차
          </button>
        </nav>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  phone: {
    width: "100%",
    maxWidth: 430,
    height: "calc(100vh - 28px)",
    background: "#ffffff",
    border: "1px solid #dbe3ef",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  textarea: {
    flex: 1,
    minHeight: 240,
    border: "1px solid #cfd8e6",
    borderRadius: 9,
    padding: 14,
    fontSize: 17,
    color: "#0f172a",
    outline: "none",
    resize: "none",
    background: "#ffffff",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
  nameBox: {
    height: 58,
    border: "1px solid #cfd8e6",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 14px",
    background: "#ffffff",
    flexShrink: 0,
  },
  icon: {
    fontSize: 25,
    color: "#0f172a",
    fontWeight: 700,
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 18,
    color: "#0f172a",
    background: "transparent",
  },
  actionButton: {
    height: 64,
    border: "1px solid #bfdbfe",
    borderRadius: 9,
    background: "#ffffff",
    color: "#0b45c5",
    fontSize: 21,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
    flexShrink: 0,
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionIcon: {
    fontSize: 24,
  },
  recentBox: {
    maxHeight: 130,
    overflowY: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    padding: 10,
    background: "#f8fafc",
    fontSize: 13,
    whiteSpace: "pre-wrap",
    color: "#334155",
  },
  recentItem: {
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 8,
    marginBottom: 8,
  },
  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 5,
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    flexShrink: 0,
  },
  statusDone: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusFail: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  recentText: {
    color: "#475569",
    lineHeight: 1.45,
  },
  dispatchList: {
    flex: 1,
    border: "1px solid #cfd8e6",
    borderRadius: 9,
    padding: 18,
    background: "#ffffff",
    overflowY: "auto",
  },
  dispatchTitle: {
    fontSize: 21,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 12,
  },
  dispatchCard: {
    width: "100%",
    border: "1px solid #dbe3ef",
    borderRadius: 9,
    background: "#ffffff",
    padding: 12,
    marginBottom: 10,
    textAlign: "left",
    color: "#0f172a",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
  },
  dispatchCardConfirmed: {
    background: "#fee2e2",
    borderColor: "#fecaca",
  },
  dispatchCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 16,
    fontWeight: 900,
  },
  dispatchCardBottom: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },
  dispatchBoxRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 10,
    marginBottom: 8,
  },
  dispatchBox: {
    minWidth: 118,
    border: "1px solid #dbe3ef",
    borderRadius: 9,
    background: "#ffffff",
    padding: 10,
    textAlign: "left",
    color: "#0f172a",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.04)",
    flexShrink: 0,
  },
  dispatchBoxActive: {
    borderColor: "#1d4ed8",
  },
  dispatchBoxConfirmed: {
    background: "#fee2e2",
    borderColor: "#fecaca",
  },
  dispatchBoxTitle: {
    fontSize: 15,
    fontWeight: 900,
  },
  dispatchBoxName: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 800,
    color: "#334155",
  },
  dispatchBoxSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
  },
  dispatchDetail: {
    marginTop: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 12,
  },
  detailLine: {
    padding: "7px 0",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 700,
  },
  detailMiniCard: {
    borderBottom: "1px solid #e2e8f0",
    padding: "9px 0",
    fontWeight: 800,
  },
  detailMiniTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  unloadButton: {
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    background: "#ffffff",
    color: "#0b45c5",
    fontSize: 13,
    fontWeight: 900,
    padding: "6px 9px",
    flexShrink: 0,
  },
  unloadButtonDone: {
    background: "#dc2626",
    borderColor: "#dc2626",
    color: "#ffffff",
  },
  startButton: {
    width: "100%",
    height: 50,
    border: "1px solid #bfdbfe",
    borderRadius: 9,
    background: "#ffffff",
    color: "#0b45c5",
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 10,
  },
  completeButton: {
    width: "100%",
    height: 50,
    border: "1px solid #fecaca",
    borderRadius: 9,
    background: "#dc2626",
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 900,
    marginTop: 12,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  bottomNav: {
    height: 88,
    borderTop: "1px solid #e5eaf2",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    padding: 14,
    background: "#ffffff",
  },
  navButton: {
    border: "1px solid #1d4ed8",
    borderRadius: 9,
    background: "#ffffff",
    color: "#0b45c5",
    fontSize: 18,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  navButtonActiveLeft: {
    background: "#ffffff",
  },
  navButtonActiveMiddle: {
    background: "#ffffff",
  },
  navButtonActiveRight: {
    background: "linear-gradient(135deg, #174eea, #0b3fc7)",
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(37, 99, 235, 0.28)",
  },
  navIcon: {
    fontSize: 24,
    lineHeight: 1,
  },
};
