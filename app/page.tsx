"use client";

import { useEffect, useRef, useState } from "react";

type Grade = "white" | "blue" | "green" | "amber" | "yellow" | "red";

type Customer = {
  id: number;
  area: string;
  name: string;
  address: string;
  grade: Grade;
  selected: boolean;
  productionDoor: boolean;
  urgent: boolean;
  forklift: boolean;
  priorityFirst?: boolean;
  distanceKm?: number | null;
  durationMin?: number | null;
  coordWarning?: boolean;
  assignedTo?: string;
  startedAt?: string | null;
  unloadingMin?: number;
};

type Coord = {
  x: string;
  y: string;
  fallback?: boolean;
  source?: string;
  name?: string;
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
};

type SavedDispatchItem = {
  id: number;
  order: number;
  area: string;
  name: string;
  grade: Grade;
  count: number;
  forklift: boolean;
  distanceKm: number | null;
  durationMin: number | null;
  etaMin: number | null;
};

type SavedDispatchSlot = {
  slot: number;
  createdAt: string;
  items: SavedDispatchItem[];
  totalDistance: number;
  totalOrderCount: number;
  copyText: string;
  driverName?: string;
};

type DispatchSlotNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const areas = [
  "전남 나주",
  "전남 목포",
  "전남 해남",
  "전남 영광",
  "전남 무안",
  "전남 진도",
];

const STORAGE_KEY = "delivery_customers_v2";
const MOBILE_DISPATCH_KEY = "delivery_mobile_dispatch_v1";
const DISPATCH_SLOTS_KEY = "delivery_dispatch_slots_v1";
const MAX_DISPATCH_SLOTS = 8;
const DEFAULT_UNLOADING_MIN = 15;
const ASSIGNEES = [
  "배송직원1",
  "배송직원2",
  "배송직원3",
  "배송직원4",
  "기사님1",
  "기사님2",
  "기사님3",
  "기사님4",
];

const initialCustomers: Customer[] = [
  {
    id: 1,
    area: "전남 목포",
    name: "로얄씽크유통",
    address: "전라남도 목포시 삼학로 234",
    grade: "white",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 2,
    area: "전남 목포",
    name: "리빙&성민",
    address: "전라남도 목포시 공단중앙로 40-1",
    grade: "white",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 3,
    area: "전남 목포",
    name: "채움퍼니처",
    address: "전라남도 목포시 연산로 218",
    grade: "blue",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 4,
    area: "전남 목포",
    name: "SD어울림",
    address: "전라남도 목포시 연산로 231",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 5,
    area: "전남 목포",
    name: "주식회사 힐링캠프",
    address: "전라남도 목포시 대양로 14-85",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 6,
    area: "전남 나주",
    name: "유한회사 중앙씽크",
    address: "전라남도 나주시 남평읍 풍림남석길 55-37",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 7,
    area: "전남 나주",
    name: "하늘가구산업",
    address: "전라남도 나주시 남평읍 원암길 49",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 8,
    area: "전남 목포",
    name: "예림주방가구",
    address: "전라남도 목포시 하당로 86",
    grade: "blue",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 9,
    area: "전남 무안",
    name: "토리 주방가구(kitchen)",
    address: "전라남도 무안군 청계면 도대로 19",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 10,
    area: "전남 목포",
    name: "세종주방",
    address: "전라남도 목포시 해안로249번길 21-1",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 11,
    area: "전남 진도",
    name: "제일씽크공장",
    address: "전라남도 진도군 군내면 정거름재길 218-3",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 12,
    area: "전남 진도",
    name: "진모씽크.가구공장",
    address: "전라남도 진도군 진도읍 교동3길 25",
    grade: "green",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 13,
    area: "전남 목포",
    name: "포이닉스",
    address: "전라남도 목포시 연산로 61",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 14,
    area: "전남 목포",
    name: "핀란디아",
    address: "전라남도 목포시 용당로 33",
    grade: "yellow",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 15,
    area: "전남 무안",
    name: "명인싱크",
    address: "전라남도 무안군 일로읍 죽사동길 24",
    grade: "yellow",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 16,
    area: "전남 목포",
    name: "제이원퍼니처",
    address: "전라남도 목포시 고하대로719번길 22",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 17,
    area: "전남 목포",
    name: "(유)공간디자인",
    address: "전라남도 목포시 공단중앙로 20-1",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 18,
    area: "전남 나주",
    name: "우림주방",
    address: "전라남도 나주시 산포면 산제리 380",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 19,
    area: "전남 해남",
    name: "엘림종합싱크",
    address: "전라남도 해남군 해남읍 내사길 454",
    grade: "yellow",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 20,
    area: "전남 목포",
    name: "에스제이주방가구",
    address: "전라남도 목포시 공단중앙로 46",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 21,
    area: "전남 목포",
    name: "하울퍼니처",
    address: "전라남도 목포시 고하대로719번길 26",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 22,
    area: "전남 나주",
    name: "미목가구",
    address: "전라남도 나주시 금천면 금영로 729",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 23,
    area: "전남 목포",
    name: "원앙씽크",
    address: "전라남도 목포시 용당로 45",
    grade: "yellow",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 24,
    area: "전남 해남",
    name: "고려씽크",
    address: "전라남도 해남군 해남읍 남부순환로 321-22",
    grade: "yellow",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 25,
    area: "전남 나주",
    name: "유한회사 정이하우징",
    address: "전라남도 나주시 남평읍 남평향교길 79-10 2호",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 26,
    area: "전남 나주",
    name: "주식회사미길",
    address: "전라남도 나주시 남평읍 남평향교길 79-8",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 27,
    area: "전남 목포",
    name: "가온퍼니쳐",
    address: "전라남도 목포시 연산동 1236-8",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 28,
    area: "전남 무안",
    name: "태광씽크",
    address: "전라남도 목포시 하당로 86",
    grade: "amber",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 29,
    area: "전남 목포",
    name: "기쁨씽크공장",
    address: "전라남도 목포시 원산로85번길 19",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 30,
    area: "전남 영광",
    name: "영광씽크",
    address: "전라남도 영광군 영광읍 와룡로33-6",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 31,
    area: "전남 무안",
    name: "두손메이드가구",
    address: "전라남도 무안군 삼향읍 무영로 217-15",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 32,
    area: "전남 목포",
    name: "씽크하우스",
    address: "전라남도 목포시 대양로109번길 80",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 33,
    area: "전남 나주",
    name: "주식회사 미광퍼니쳐",
    address: "전라남도 나주시 산포면 산남로 134-27",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 34,
    area: "전남 나주",
    name: "부일가구",
    address: "전라남도 나주시 남평읍 원암길 94",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
  {
    id: 35,
    area: "전남 나주",
    name: "하나로씽크공장",
    address: "전라남도 나주시 건재로 281",
    grade: "red",
    selected: false,
    productionDoor: false,
    urgent: false,
    forklift: false,
  },
];

export default function Home() {
  const [startAddress, setStartAddress] = useState(
    "전남 장성군 동화면 금강산로 159",
  );
  const [middleCategory, setMiddleCategory] = useState<
    "목포" | "광주" | "순천"
  >("목포");
  const [selectedArea, setSelectedArea] = useState("전남 목포");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [message, setMessage] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [kakaoText, setKakaoText] = useState("");
  const [orderCounts, setOrderCounts] = useState<Record<number, number>>({});
  const [pendingOrderIds, setPendingOrderIds] = useState<number[]>([]);
  const [pendingOrderTimes, setPendingOrderTimes] = useState<
    Record<number, string>
  >({});
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [routeOrderIds, setRouteOrderIds] = useState<number[]>([]);
  const [priorityRecalcKey, setPriorityRecalcKey] = useState(0);
  const [dispatchSlots, setDispatchSlots] = useState<SavedDispatchSlot[]>([]);
  const [selectedDispatchNumber, setSelectedDispatchNumber] = useState<DispatchSlotNumber>(1);
  const [dispatchDriverNames, setDispatchDriverNames] = useState<Record<number, string>>({});
  const [dispatchCopyText, setDispatchCopyText] = useState("");
  const [openedCompletedSlotNumber, setOpenedCompletedSlotNumber] = useState<number | null>(null);
  const coordCacheRef = useRef<Map<string, Coord>>(new Map());
  const distanceCacheRef = useRef<
    Map<string, { distanceKm: number; durationMin: number }>
  >(new Map());

  const [form, setForm] = useState({
    id: 0,
    area: "전남 목포",
    name: "",
    address: "",
    grade: "white" as Grade,
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [pendingCategory, setPendingCategory] = useState<
    "목포" | "광주" | "순천"
  >("목포");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setCustomers(
          parsed.map((c: Customer) => ({
            ...c,
            selected: false,
            productionDoor: false,
            urgent: false,
            forklift: false,
            priorityFirst: false,
            distanceKm: null,
            durationMin: null,
            coordWarning: false,
            assignedTo: c.assignedTo ?? "",
            startedAt: null,
            unloadingMin: c.unloadingMin ?? DEFAULT_UNLOADING_MIN,
          })),
        );
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISPATCH_SLOTS_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setDispatchSlots(
          parsed
            .filter((slot: SavedDispatchSlot) => slot.slot >= 1 && slot.slot <= MAX_DISPATCH_SLOTS)
            .sort((a: SavedDispatchSlot, b: SavedDispatchSlot) => a.slot - b.slot),
        );
      }
    } catch {
      localStorage.removeItem(DISPATCH_SLOTS_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DISPATCH_SLOTS_KEY, JSON.stringify(dispatchSlots));
    } catch {
      // 배차지정 저장 실패 시 화면은 그대로 유지
    }
  }, [dispatchSlots]);

  useEffect(() => {
    try {
      const saveData = customers.map((c) => ({
        ...c,
        selected: false,
        productionDoor: false,
        urgent: false,
        forklift: false,
        priorityFirst: false,
        distanceKm: null,
        durationMin: null,
        coordWarning: false,
        startedAt: null,
        unloadingMin: c.unloadingMin ?? DEFAULT_UNLOADING_MIN,
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {
      // 저장 실패 시 화면은 그대로 유지
    }
  }, [customers]);

  const visibleAreas =
    middleCategory === "목포"
      ? areas
      : middleCategory === "광주"
        ? ["광주"]
        : ["순천"];

  const gradeOrder: Record<Grade, number> = {
    white: 1,
    blue: 2,
    green: 3,
    amber: 4,
    yellow: 5,
    red: 6,
  };

  const gradePreferencePenalty: Record<Grade, number> = {
    white: -20,
    blue: 0,
    green: 20,
    amber: 35,
    yellow: 90,
    red: 110,
  };

  const visibleCustomers = customers
    .filter((c) => c.area === selectedArea)
    .sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]);

  const selectedCustomers = customers
    .filter((c) => c.selected)
    .sort((a, b) => {
      const ai = routeOrderIds.indexOf(a.id);
      const bi = routeOrderIds.indexOf(b.id);

      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;

      return ai - bi;
    });

  const getPendingGroup = (customer: Customer) => {
    if (customer.area === "광주" || customer.address.includes("광주"))
      return "광주";
    if (customer.area === "순천" || customer.address.includes("순천"))
      return "순천";
    return "목포";
  };

  const pendingAllCustomers = pendingOrderIds
    .map((id) => customers.find((c) => c.id === id && !c.selected))
    .filter(Boolean) as Customer[];

  const pendingCustomers = pendingAllCustomers.filter(
    (customer) => getPendingGroup(customer) === pendingCategory,
  );

  const hasPendingByCategory = (category: "목포" | "광주" | "순천") => {
    return pendingAllCustomers.some(
      (customer) => getPendingGroup(customer) === category,
    );
  };

  const getColor = (grade: Grade) => {
    if (grade === "blue") return "#2563eb";
    if (grade === "green") return "#15803d";
    if (grade === "amber") return "#d97706";
    if (grade === "yellow") return "#a16207";
    if (grade === "red") return "#dc2626";
    return "#111827";
  };

  const normalizeAddress = (value: string) => {
    return value
      .replace(/\s+/g, " ")
      .replace(/전남/g, "전라남도")
      .replace(/대양로\s+109번길/g, "대양로109번길")
      .replace(/해안로\s+249번길/g, "해안로249번길")
      .replace(/고하대로\s+719번길/g, "고하대로719번길")
      .replace(/와룡로\s+33-6/g, "와룡로33-6")
      .replace(/(\S+로)\s+(\d+번길)/g, "$1$2")
      .replace(/(\S+대로)\s+(\d+번길)/g, "$1$2")
      .trim();
  };

  const updateCustomer = (
    id: number,
    field: "selected" | "productionDoor" | "urgent" | "forklift",
    value: boolean,
  ) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]: value,
              priorityFirst: field === "selected" && !value ? false : c.priorityFirst,
            }
          : c,
      ),
    );

    if (field === "selected" && !value) {
      setRouteOrderIds((prev) => prev.filter((routeId) => routeId !== id));
    }
  };

  const updatePriorityFirst = (id: number, value: boolean) => {
    setCustomers((prev) =>
      prev.map((customer) => ({
        ...customer,
        priorityFirst: value
          ? customer.id === id
          : customer.id === id
            ? false
            : customer.priorityFirst,
      })),
    );

    setMessage(
      value
        ? "우선순위 업체 기준으로 전체 코스 재계산 중..."
        : "우선순위 해제 후 전체 코스 재계산 중...",
    );
    setPriorityRecalcKey((prev) => prev + 1);
  };

  const resetDispatch = () => {
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        selected: false,
        productionDoor: false,
        urgent: false,
        forklift: false,
        priorityFirst: false,
        distanceKm: null,
        durationMin: null,
        coordWarning: false,
        startedAt: null,
        unloadingMin: c.unloadingMin ?? DEFAULT_UNLOADING_MIN,
      })),
    );
    setRouteOrderIds([]);
    setKakaoText("");
    setMessage("배차 초기화 완료");
  };

  const geocode = async (
    address: string,
    name?: string,
    area?: string,
  ): Promise<Coord> => {
    const baseAddress = normalizeAddress(address);
    const cacheKey = `${baseAddress}|${name || ""}|${area || ""}`;
    const cached = coordCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const makeRequests = () => {
      const requests: { address: string; name?: string; area?: string }[] = [];

      // 1순위: 원래 등록 주소 그대로
      requests.push({ address: baseAddress, name, area });

      // 2순위: 주소 + 업체명
      if (name) {
        requests.push({ address: `${baseAddress} ${name}`, name, area });
      }

      // 3순위: 지역 + 업체명
      if (name && area) {
        requests.push({ address: `${area} ${name}`, name, area });
      }

      // 4순위: 시/군 단위 + 업체명
      const simpleArea = area?.replace("전남 ", "").trim();
      if (name && simpleArea) {
        requests.push({ address: `${simpleArea} ${name}`, name, area });
      }

      // 5순위: 업체명만 검색
      if (name) {
        requests.push({ address: name, name, area });
      }

      // 6순위: 괄호/특수문자 제거 업체명 검색
      if (name) {
        const cleanName = name
          .replace(/주식회사|유한회사|유\)|\(유\)|㈜|주\)/g, "")
          .replace(/[()&.·\-_\/]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleanName && cleanName !== name) {
          requests.push({
            address: `${baseAddress} ${cleanName}`,
            name: cleanName,
            area,
          });
          if (area)
            requests.push({
              address: `${area} ${cleanName}`,
              name: cleanName,
              area,
            });
          requests.push({ address: cleanName, name: cleanName, area });
        }
      }

      // 중복 제거
      const seen = new Set<string>();
      return requests.filter((request) => {
        const key = `${request.address}|${request.name || ""}|${request.area || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    let lastError = "주소 변환 실패";

    for (const request of makeRequests()) {
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        const data = await res.json();

        if (!res.ok) {
          lastError = data.error || "주소 변환 실패";
          continue;
        }

        if (!data.x || !data.y) {
          lastError = "좌표값 없음";
          continue;
        }

        const coord = {
          x: String(data.x),
          y: String(data.y),
          fallback: Boolean(data.fallback),
          source: data.source,
          name: data.name,
        };

        coordCacheRef.current.set(cacheKey, coord);
        return coord;
      } catch (error: any) {
        lastError = error?.message || "주소 변환 실패";
      }
    }

    throw new Error(`${name ? `${name} ` : ""}${lastError}`);
  };

  const getDistance = async (
    origin: Coord,
    destination: Coord,
  ): Promise<{ distanceKm: number; durationMin: number }> => {
    const cacheKey = `${origin.x},${origin.y}->${destination.x},${destination.y}`;
    const cached = distanceCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const res = await fetch("/api/distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "거리 계산 실패");
    if (data.distanceKm == null) throw new Error("거리값 없음");

    const result = {
      distanceKm: Number(data.distanceKm),
      durationMin: Number(data.durationMin ?? 0),
    };

    distanceCacheRef.current.set(cacheKey, result);
    return result;
  };

  const getWholeRouteSections = async (
    origin: Coord,
    destinations: Coord[],
  ): Promise<{ distanceKm: number; durationMin: number }[]> => {
    const res = await fetch("/api/distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destinations }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "전체 경로 계산 실패");
    if (!Array.isArray(data.sections)) throw new Error("구간 거리값 없음");

    return data.sections.map((s: any) => ({
      distanceKm: Number(s.distanceKm ?? 0),
      durationMin: Number(s.durationMin ?? 0),
    }));
  };

  const getRouteAreaKey = (customer: Customer) => {
    const raw = `${customer.area} ${customer.address}`;

    if (raw.includes("목포")) return "목포";
    if (raw.includes("나주")) return "나주";
    if (raw.includes("무안")) return "무안";
    if (raw.includes("해남")) return "해남";
    if (raw.includes("진도")) return "진도";
    if (raw.includes("영광")) return "영광";
    if (raw.includes("광주")) return "광주";
    if (raw.includes("순천")) return "순천";

    return customer.area.replace("전남 ", "");
  };

  const getAreaFlowPenalty = (fromArea: string, toArea: string) => {
    // 전남 전체 확장용: 목포/무안/나주 같은 특정 지역명 순서는 강제하지 않음.
    // 자연스러운 흐름은 아래의 전체 거리·시간 점수와 근거리 윈도우 재정렬에서 판단함.
    if (fromArea === toArea || fromArea === "출발지") return 0;
    return 0;
  };

  const isRedRouteCustomer = (customer: Customer) => {
    // 저장된 localStorage 데이터가 예전 등급을 들고 있어도
    // 주식회사미길은 현재 운영 기준상 레드로 취급함.
    return customer.grade === "red" || customer.name.includes("미길");
  };

  const getGradeRoutePenalty = (
    customer: Customer,
    step: number,
    total: number,
  ) => {
    const earlyRatio = total <= 1 ? 0 : 1 - step / (total - 1);
    const positionRatio = total <= 1 ? 1 : step / (total - 1);

    // 레드는 운영상 강한 비선호 대상.
    // 첫집은 사실상 금지, 중반 이전도 매우 강하게 밀어냄.
    // 뒤쪽 20~25% 구간에서만 자연스럽게 포함되도록 둠.
    if (isRedRouteCustomer(customer)) {
      if (total > 1 && step === 0) return 20000;
      if (positionRatio < 0.5) return 12000 * earlyRatio + 3500;
      if (positionRatio < 0.75) return 6500 * earlyRatio + 1800;
      return 900 * earlyRatio + 250;
    }

    // 등급은 강제가 아니라 선호값만 줌.
    // white는 화면상 블랙 등급 역할이라 초반 선호를 더 줌.
    if (customer.grade === "white") return -230 * earlyRatio;
    if (customer.grade === "blue") return -65 * earlyRatio;
    if (customer.grade === "green") return -18 * earlyRatio;
    if (customer.grade === "amber") return 8 * earlyRatio;
    if (customer.grade === "yellow") return 28 * earlyRatio;

    return 0;
  };

  const getFlagRoutePenalty = (
    customer: Customer,
    step: number,
    total: number,
  ) => {
    const earlyRatio = total <= 1 ? 0 : 1 - step / (total - 1);

    // 지게발은 경로 우선순위에 아무 영향 없음.
    // 생산도어/긴급배송만 기존처럼 초반 선호값으로 반영.
    if (customer.productionDoor) return -220 * earlyRatio;
    if (customer.urgent) return -150 * earlyRatio;

    return 0;
  };

  const makeDistanceKey = (from: Coord, to: Coord) => {
    return `${from.x},${from.y}->${to.x},${to.y}`;
  };

  const prefetchRouteDistances = async <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    targets: T[],
  ) => {
    const coords = [startCoord, ...targets.map((target) => target.coord)];

    for (let i = 0; i < coords.length; i++) {
      for (let j = 1; j < coords.length; j++) {
        if (i === j) continue;
        await getDistance(coords[i], coords[j]);
      }
    }
  };

  const readCachedDistance = (from: Coord, to: Coord) => {
    const key = makeDistanceKey(from, to);
    const cached = distanceCacheRef.current.get(key);

    if (cached) return cached;

    return { distanceKm: 9999, durationMin: 9999 };
  };

  const evaluateRouteScore = <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    route: T[],
  ) => {
    let currentCoord = startCoord;
    let currentArea = "출발지";
    const visitedAreas = new Set<string>([currentArea]);
    const areaExitCount: Record<string, number> = {};
    let totalDistance = 0;
    let totalDuration = 0;
    let score = 0;

    for (let step = 0; step < route.length; step++) {
      const customer = route[step];
      const result = readCachedDistance(currentCoord, customer.coord);
      const candidateArea = getRouteAreaKey(customer);
      const changedArea = currentArea !== candidateArea;
      const returnedArea =
        changedArea &&
        visitedAreas.has(candidateArea) &&
        candidateArea !== "출발지";
      const exitedCount = areaExitCount[candidateArea] ?? 0;

      // 같은 지역을 나갔다가 다시 들어가는 왕복만 강하게 불이익.
      // 단순 역방향 이동 자체는 막지 않음.
      const repeatAreaPenalty = returnedArea ? 210 + exitedCount * 90 : 0;
      const areaSwitchPenalty = changedArea && step > 0 ? 4 : 0;
      const flowPenalty = getAreaFlowPenalty(currentArea, candidateArea);
      const gradePenalty = getGradeRoutePenalty(customer, step, route.length);
      const flagPenalty = getFlagRoutePenalty(customer, step, route.length);
      const moveCost = result.distanceKm + result.durationMin / 10;

      totalDistance += result.distanceKm;
      totalDuration += result.durationMin;
      score +=
        moveCost +
        repeatAreaPenalty +
        areaSwitchPenalty +
        flowPenalty +
        gradePenalty +
        flagPenalty;

      if (changedArea && currentArea !== "출발지") {
        areaExitCount[currentArea] = (areaExitCount[currentArea] ?? 0) + 1;
      }

      visitedAreas.add(candidateArea);
      currentArea = candidateArea;
      currentCoord = customer.coord;
    }

    return { score, totalDistance, totalDuration };
  };

  const evaluateRouteTravelScore = <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    route: T[],
  ) => {
    let currentCoord = startCoord;
    let currentArea = "출발지";
    const visitedAreas = new Set<string>([currentArea]);
    const areaExitCount: Record<string, number> = {};
    let score = 0;

    for (let step = 0; step < route.length; step++) {
      const customer = route[step];
      const result = readCachedDistance(currentCoord, customer.coord);
      const candidateArea = getRouteAreaKey(customer);
      const changedArea = currentArea !== candidateArea;
      const returnedArea =
        changedArea &&
        visitedAreas.has(candidateArea) &&
        candidateArea !== "출발지";
      const exitedCount = areaExitCount[candidateArea] ?? 0;

      const repeatAreaPenalty = returnedArea ? 210 + exitedCount * 90 : 0;
      const areaSwitchPenalty = changedArea && step > 0 ? 2 : 0;
      const flowPenalty = getAreaFlowPenalty(currentArea, candidateArea);
      const moveCost = result.distanceKm + result.durationMin / 10;

      // 미세 순서 보정은 등급보다 실제 주행 흐름을 우선함.
      score += moveCost + repeatAreaPenalty + areaSwitchPenalty + flowPenalty;

      if (changedArea && currentArea !== "출발지") {
        areaExitCount[currentArea] = (areaExitCount[currentArea] ?? 0) + 1;
      }

      visitedAreas.add(candidateArea);
      currentArea = candidateArea;
      currentCoord = customer.coord;
    }

    return score;
  };

  const getThreeStepLookaheadScore = <T extends Customer & { coord: Coord }>(
    currentCoord: Coord,
    currentArea: string,
    visitedAreas: Set<string>,
    areaExitCount: Record<string, number>,
    remaining: T[],
    stepOffset: number,
    total: number,
  ) => {
    if (remaining.length === 0) return 0;

    const depth = Math.min(3, remaining.length);
    const candidatePool = [...remaining]
      .sort((a, b) => {
        const da = readCachedDistance(currentCoord, a.coord);
        const db = readCachedDistance(currentCoord, b.coord);
        return da.distanceKm + da.durationMin / 10 - (db.distanceKm + db.durationMin / 10);
      })
      .slice(0, Math.min(7, remaining.length));

    let best = Number.POSITIVE_INFINITY;

    const walk = (
      coord: Coord,
      area: string,
      visited: Set<string>,
      exits: Record<string, number>,
      pool: T[],
      depthLeft: number,
      step: number,
      cost: number,
    ) => {
      if (depthLeft === 0 || pool.length === 0) {
        if (cost < best) best = cost;
        return;
      }

      for (const candidate of pool) {
        const result = readCachedDistance(coord, candidate.coord);
        const candidateArea = getRouteAreaKey(candidate);
        const changedArea = area !== candidateArea;
        const returnedArea =
          changedArea && visited.has(candidateArea) && candidateArea !== "출발지";
        const exitedCount = exits[candidateArea] ?? 0;

        const repeatAreaPenalty = returnedArea ? 210 + exitedCount * 90 : 0;
        const areaSwitchPenalty = changedArea && step > 0 ? 4 : 0;
        const flowPenalty = getAreaFlowPenalty(area, candidateArea);
        const moveCost = result.distanceKm + result.durationMin / 10;
        const gradePenalty = getGradeRoutePenalty(candidate, step, total);
        const flagPenalty = getFlagRoutePenalty(candidate, step, total);

        const nextVisited = new Set(visited);
        nextVisited.add(candidateArea);

        const nextExits = { ...exits };
        if (changedArea && area !== "출발지") {
          nextExits[area] = (nextExits[area] ?? 0) + 1;
        }

        walk(
          candidate.coord,
          candidateArea,
          nextVisited,
          nextExits,
          pool.filter((item) => item.id !== candidate.id),
          depthLeft - 1,
          step + 1,
          cost +
            moveCost +
            repeatAreaPenalty +
            areaSwitchPenalty +
            flowPenalty +
            gradePenalty +
            flagPenalty,
        );
      }
    };

    walk(
      currentCoord,
      currentArea,
      new Set(visitedAreas),
      { ...areaExitCount },
      candidatePool,
      depth,
      stepOffset,
      0,
    );

    return best === Number.POSITIVE_INFINITY ? 0 : best;
  };

  const buildBeamRoute = <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    targets: T[],
    seedRoute: T[] = [],
  ) => {
    type RouteState = {
      route: T[];
      remaining: T[];
      currentCoord: Coord;
      currentArea: string;
      visitedAreas: Set<string>;
      areaExitCount: Record<string, number>;
      cost: number;
    };

    const beamWidth =
      targets.length <= 7 ? 180 : targets.length <= 10 ? 240 : 300;
    const startArea = "출발지";

    let initialRoute = [...seedRoute];
    let initialRemaining = targets.filter(
      (target) => !initialRoute.some((seed) => seed.id === target.id),
    );
    let initialCurrentCoord = startCoord;
    let initialCurrentArea = startArea;
    let initialVisitedAreas = new Set<string>([startArea]);
    let initialAreaExitCount: Record<string, number> = {};
    let initialCost = 0;

    for (let step = 0; step < initialRoute.length; step++) {
      const customer = initialRoute[step];
      const result = readCachedDistance(initialCurrentCoord, customer.coord);
      const candidateArea = getRouteAreaKey(customer);
      const changedArea = initialCurrentArea !== candidateArea;
      const returnedArea =
        changedArea &&
        initialVisitedAreas.has(candidateArea) &&
        candidateArea !== startArea;
      const exitedCount = initialAreaExitCount[candidateArea] ?? 0;

      const repeatAreaPenalty = returnedArea ? 210 + exitedCount * 90 : 0;
      const areaSwitchPenalty = changedArea && step > 0 ? 4 : 0;
      const flowPenalty = getAreaFlowPenalty(initialCurrentArea, candidateArea);
      const moveCost = result.distanceKm + result.durationMin / 10;

      initialCost +=
        moveCost +
        repeatAreaPenalty +
        areaSwitchPenalty +
        flowPenalty +
        getGradeRoutePenalty(customer, step, targets.length) +
        getFlagRoutePenalty(customer, step, targets.length);

      if (changedArea && initialCurrentArea !== startArea) {
        initialAreaExitCount[initialCurrentArea] =
          (initialAreaExitCount[initialCurrentArea] ?? 0) + 1;
      }

      initialVisitedAreas.add(candidateArea);
      initialCurrentArea = candidateArea;
      initialCurrentCoord = customer.coord;
    }

    let states: RouteState[] = [
      {
        route: initialRoute,
        remaining: initialRemaining,
        currentCoord: initialCurrentCoord,
        currentArea: initialCurrentArea,
        visitedAreas: initialVisitedAreas,
        areaExitCount: initialAreaExitCount,
        cost: initialCost,
      },
    ];

    while (states.some((state) => state.remaining.length > 0)) {
      const nextStates: RouteState[] = [];

      for (const state of states) {
        if (state.remaining.length === 0) {
          nextStates.push(state);
          continue;
        }

        for (const candidate of state.remaining) {
          const step = state.route.length;
          const result = readCachedDistance(
            state.currentCoord,
            candidate.coord,
          );
          const candidateArea = getRouteAreaKey(candidate);
          const changedArea = state.currentArea !== candidateArea;
          const returnedArea =
            changedArea &&
            state.visitedAreas.has(candidateArea) &&
            candidateArea !== startArea;

          const exitedCount = state.areaExitCount[candidateArea] ?? 0;
          const repeatAreaPenalty = returnedArea ? 210 + exitedCount * 90 : 0;
          const areaSwitchPenalty = changedArea && step > 0 ? 4 : 0;
          const flowPenalty = getAreaFlowPenalty(state.currentArea, candidateArea);
          const gradePenalty = getGradeRoutePenalty(
            candidate,
            step,
            targets.length,
          );
          const flagPenalty = getFlagRoutePenalty(
            candidate,
            step,
            targets.length,
          );
          const moveCost = result.distanceKm + result.durationMin / 10;

          const nextCost =
            state.cost +
            moveCost +
            repeatAreaPenalty +
            areaSwitchPenalty +
            flowPenalty +
            gradePenalty +
            flagPenalty;

          const nextVisitedAreas = new Set(state.visitedAreas);
          nextVisitedAreas.add(candidateArea);

          const nextAreaExitCount = { ...state.areaExitCount };
          if (changedArea && state.currentArea !== startArea) {
            nextAreaExitCount[state.currentArea] =
              (nextAreaExitCount[state.currentArea] ?? 0) + 1;
          }

          nextStates.push({
            route: [...state.route, candidate],
            remaining: state.remaining.filter(
              (item) => item.id !== candidate.id,
            ),
            currentCoord: candidate.coord,
            currentArea: candidateArea,
            visitedAreas: nextVisitedAreas,
            areaExitCount: nextAreaExitCount,
            cost: nextCost,
          });
        }
      }

      nextStates.sort((a, b) => {
        const aLookahead = getThreeStepLookaheadScore(
          a.currentCoord,
          a.currentArea,
          a.visitedAreas,
          a.areaExitCount,
          a.remaining,
          a.route.length,
          targets.length,
        );
        const bLookahead = getThreeStepLookaheadScore(
          b.currentCoord,
          b.currentArea,
          b.visitedAreas,
          b.areaExitCount,
          b.remaining,
          b.route.length,
          targets.length,
        );

        return a.cost + aLookahead - (b.cost + bLookahead);
      });
      states = nextStates.slice(0, beamWidth);
    }

    return states[0]?.route ?? targets;
  };

  const getCandidateRoutes = <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    targets: T[],
  ) => {
    const candidates: T[][] = [];
    const addCandidate = (route: T[]) => {
      const key = route.map((item) => item.id).join(",");
      if (!key) return;
      if (route.length > 1 && isRedRouteCustomer(route[0])) return;
      if (
        candidates.some(
          (candidate) => candidate.map((item) => item.id).join(",") === key,
        )
      )
        return;
      candidates.push(route);
    };

    // 1. 전체 자유 최적화
    const normal = buildBeamRoute(startCoord, targets);
    addCandidate(normal);
    addCandidate([...normal].reverse());

    // 2. 각 업체를 첫 방문지로 고정한 후보도 전부 계산
    //    정주행/역주행 시작점이 달라지는 문제를 잡기 위함.
    for (const first of targets) {
      // 레드는 시작점 고정 후보에서 제외.
      // 전체 경로상 꼭 필요할 때는 buildBeamRoute 내부에서 뒤쪽에 자연 포함됨.
      if (isRedRouteCustomer(first) && targets.length > 1) continue;

      const seeded = buildBeamRoute(startCoord, targets, [first]);
      addCandidate(seeded);
      addCandidate([...seeded].reverse());
    }

    // 3. 등급 좋은 업체를 초반 선호하는 후보
    const preferredFirst = [...targets]
      .filter((target) => !(isRedRouteCustomer(target) && targets.length > 1))
      .sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]);

    for (const first of preferredFirst.slice(
      0,
      Math.min(4, preferredFirst.length),
    )) {
      const seeded = buildBeamRoute(startCoord, targets, [first]);
      addCandidate(seeded);
    }

    return candidates;
  };

  const optimizeRouteWithRouteCost = async <
    T extends Customer & { coord: Coord },
  >(
    startCoord: Coord,
    targets: T[],
  ) => {
    if (targets.length <= 1) return targets;

    await prefetchRouteDistances(startCoord, targets);

    const candidates = getCandidateRoutes(startCoord, targets);
    let bestRoute = candidates[0] ?? targets;
    let bestScore = evaluateRouteScore(startCoord, bestRoute).score;

    for (const route of candidates) {
      const score = evaluateRouteScore(startCoord, route).score;
      if (score < bestScore) {
        bestRoute = route;
        bestScore = score;
      }
    }

    return bestRoute;
  };

  const chooseBestDirection = async <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    route: T[],
  ) => {
    if (route.length <= 1) return route;

    const forward = route;
    const backward = [...route].reverse();

    const forwardCost = evaluateRouteScore(startCoord, forward);
    const backwardCost = evaluateRouteScore(startCoord, backward);

    // 정방향/역방향 둘 다 점수로만 비교.
    // 기존처럼 작은 차이라고 유지하지 않음.
    return backwardCost.score < forwardCost.score ? backward : forward;
  };

  const pushRedBackIfRouteSafe = <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    route: T[],
  ) => {
    if (route.length <= 1 || !route.some((customer) => isRedRouteCustomer(customer))) {
      return route;
    }

    // 레드는 강한 후순위지만, 무조건 맨 끝으로 보내면
    // 목포 → 나주 → 다시 목포 같은 말 안 되는 복귀 코스가 생길 수 있음.
    // 그래서 "맨 끝"이 아니라, 주행 흐름을 거의 망치지 않는 범위 안에서만
    // 가능한 가장 뒤쪽 위치로 이동시킴.
    const SAFE_INCREASE_RATIO = 0.035;

    let bestRoute = [...route];
    let changed = true;

    while (changed) {
      changed = false;

      for (let i = 0; i < bestRoute.length - 1; i++) {
        const customer = bestRoute[i];
        if (!isRedRouteCustomer(customer)) continue;

        const routeWithoutRed = bestRoute.filter((item) => item.id !== customer.id);
        const baseScore = evaluateRouteTravelScore(startCoord, bestRoute);

        let bestMoveRoute = bestRoute;
        let bestMoveIndex = i;

        // 뒤에서부터 넣어보되, 주행 흐름이 3.5% 이상 나빠지는 위치는 버림.
        // 즉, 레드는 최대한 뒤로 보내지만 다시 돌아가는 코스는 자동 차단됨.
        for (let insertIndex = routeWithoutRed.length; insertIndex > i; insertIndex--) {
          const candidateRoute = [
            ...routeWithoutRed.slice(0, insertIndex),
            customer,
            ...routeWithoutRed.slice(insertIndex),
          ];
          const candidateScore = evaluateRouteTravelScore(startCoord, candidateRoute);

          if (candidateScore <= baseScore * (1 + SAFE_INCREASE_RATIO)) {
            bestMoveRoute = candidateRoute;
            bestMoveIndex = insertIndex;
            break;
          }
        }

        if (bestMoveIndex !== i) {
          bestRoute = bestMoveRoute;
          changed = true;
          break;
        }
      }
    }

    return bestRoute;
  };

  const getPermutations = <T,>(items: T[]) => {
    const result: T[][] = [];

    const backtrack = (current: T[], remaining: T[]) => {
      if (remaining.length === 0) {
        result.push(current);
        return;
      }

      for (let i = 0; i < remaining.length; i++) {
        backtrack(
          [...current, remaining[i]],
          remaining.filter((_, index) => index !== i),
        );
      }
    };

    backtrack([], items);
    return result;
  };

  const shouldRefineWindow = <T extends Customer & { coord: Coord }>(
    window: T[],
  ) => {
    if (window.length < 3) return false;

    // 지역명 기준이 아니라 좌표/도로거리 기준으로만 내부 꼬임을 판단함.
    // 목포, 광주, 순천, 여수, 광양, 담양 등 어느 지역이든 가까운 생활권이면 재정렬 대상.
    let adjacentNearCount = 0;
    for (let i = 0; i < window.length - 1; i++) {
      const result = readCachedDistance(window[i].coord, window[i + 1].coord);
      if (result.distanceKm <= 25 || result.durationMin <= 35) {
        adjacentNearCount++;
      }
    }

    if (adjacentNearCount >= window.length - 2) return true;

    // 연속 순서가 꼬여 있어도, 창 안의 각 업체가 다른 업체와 가까우면 생활권으로 보고 재정렬함.
    const connectedCount = window.filter((item) => {
      return window.some((other) => {
        if (item.id === other.id) return false;
        const result = readCachedDistance(item.coord, other.coord);
        return result.distanceKm <= 25 || result.durationMin <= 35;
      });
    }).length;

    return connectedCount >= Math.ceil(window.length * 0.8);
  };

  const refineNearbyWindows = <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    route: T[],
  ) => {
    if (route.length <= 2) return route;

    let bestRoute = [...route];

    // 큰 방향은 유지하고, 가까운 3~5개 업체 구간만 내부 순서를 다시 비교함.
    // 지역명과 무관하게 전남 전체에서 가까운 생활권 내부 꼬임을 자동 보정함.
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;

      for (const windowSize of [5, 4, 3]) {
        if (bestRoute.length < windowSize) continue;

        for (let start = 0; start <= bestRoute.length - windowSize; start++) {
          const beforeWindow = bestRoute.slice(0, start);
          const window = bestRoute.slice(start, start + windowSize);
          const afterWindow = bestRoute.slice(start + windowSize);

          if (!shouldRefineWindow(window)) continue;

          const currentScore = evaluateRouteTravelScore(startCoord, bestRoute);
          let localBest = bestRoute;
          let localBestScore = currentScore;

          for (const permutation of getPermutations(window)) {
            const candidateRoute = [
              ...beforeWindow,
              ...permutation,
              ...afterWindow,
            ];
            const candidateScore = evaluateRouteTravelScore(
              startCoord,
              candidateRoute,
            );

            if (candidateScore + 0.3 < localBestScore) {
              localBest = candidateRoute;
              localBestScore = candidateScore;
            }
          }

          if (localBest !== bestRoute) {
            bestRoute = localBest;
            changed = true;
          }
        }
      }

      if (!changed) break;
    }

    return bestRoute;
  };

  const sortDispatch = async () => {
    try {
      setMessage("전체 경로 최적화 계산 중...");

      const targets = customers.filter((c) => c.selected);

      if (targets.length === 0) {
        setMessage("선택된 거래처가 없습니다.");
        return;
      }

      const startCoord = await geocode(startAddress, "출발지", "장성");

      type RouteTarget = Customer & { coord: Coord };

      const withCoords: RouteTarget[] = [];

      for (const customer of targets) {
        const coord = await geocode(
          customer.address,
          customer.name,
          customer.area,
        );
        withCoords.push({
          ...customer,
          coord,
          distanceKm: null,
          durationMin: null,
          coordWarning: false,
        });
      }

      const priorityCustomer = withCoords.find((customer) => customer.priorityFirst);
      let orderedRoute: RouteTarget[] = [];

      if (priorityCustomer) {
        const restTargets = withCoords.filter(
          (customer) => customer.id !== priorityCustomer.id,
        );

        const optimizedRestRoute = await optimizeRouteWithRouteCost(
          priorityCustomer.coord,
          restTargets,
        );
        const directionRestRoute = await chooseBestDirection(
          priorityCustomer.coord,
          optimizedRestRoute,
        );
        const refinedRestRoute = refineNearbyWindows(
          priorityCustomer.coord,
          directionRestRoute,
        );
        const safeRestRoute = pushRedBackIfRouteSafe(
          priorityCustomer.coord,
          refinedRestRoute,
        );

        orderedRoute = [priorityCustomer, ...safeRestRoute];
      } else {
        const optimizedRoute = await optimizeRouteWithRouteCost(
          startCoord,
          withCoords,
        );
        const directionRoute = await chooseBestDirection(
          startCoord,
          optimizedRoute,
        );
        const refinedRoute = refineNearbyWindows(startCoord, directionRoute);
        orderedRoute = pushRedBackIfRouteSafe(startCoord, refinedRoute);

        // 마지막 안전장치: 2개 이상 선택된 경우 레드/미길이 1번이면 절대 시작점으로 두지 않음.
        // 가장 좋은 비레드 시작 후보를 앞으로 보내고, 이후 레드는 후순위 보정에 다시 맡김.
        if (orderedRoute.length > 1 && isRedRouteCustomer(orderedRoute[0])) {
          const nonRedStart = orderedRoute.find(
            (customer) => !isRedRouteCustomer(customer),
          );
          if (nonRedStart) {
            orderedRoute = [
              nonRedStart,
              ...orderedRoute.filter((customer) => customer.id !== nonRedStart.id),
            ];
            orderedRoute = pushRedBackIfRouteSafe(startCoord, orderedRoute);
          }
        }
      }

      let currentCoord = startCoord;
      const sectionMap = new Map<
        number,
        { distanceKm: number; durationMin: number }
      >();

      for (const customer of orderedRoute) {
        const section = await getDistance(currentCoord, customer.coord);
        sectionMap.set(customer.id, {
          distanceKm: Math.round(section.distanceKm * 10) / 10,
          durationMin: section.durationMin,
        });
        currentCoord = customer.coord;
      }

      const finalRoute: Customer[] = orderedRoute.map((customer) => {
        const section = sectionMap.get(customer.id);

        return {
          id: customer.id,
          area: customer.area,
          name: customer.name,
          address: customer.address,
          grade: customer.grade,
          selected: true,
          productionDoor: customer.productionDoor,
          urgent: customer.urgent,
          forklift: customer.forklift,
          priorityFirst: customer.priorityFirst ?? false,
          assignedTo: customer.assignedTo ?? "",
          startedAt: customer.startedAt ?? null,
          unloadingMin: DEFAULT_UNLOADING_MIN,
          distanceKm: section?.distanceKm ?? null,
          durationMin: section?.durationMin ?? null,
          coordWarning:
            (section?.distanceKm ?? 0) <= 0.2 ||
            (section?.distanceKm ?? 0) >= 180,
        };
      });

      const routeMap = new Map(finalRoute.map((c) => [c.id, c]));
      const nextRouteOrderIds = finalRoute.map((c) => c.id);

      setRouteOrderIds(nextRouteOrderIds);

      setCustomers((prev) =>
        prev.map((customer) => {
          const routed = routeMap.get(customer.id);

          if (routed) {
            return {
              ...customer,
              selected: true,
              productionDoor: routed.productionDoor,
              urgent: routed.urgent,
              forklift: routed.forklift,
              priorityFirst: routed.priorityFirst ?? false,
              assignedTo: customer.assignedTo ?? routed.assignedTo ?? "",
              startedAt: customer.startedAt ?? routed.startedAt ?? null,
              unloadingMin:
                customer.unloadingMin ??
                routed.unloadingMin ??
                DEFAULT_UNLOADING_MIN,
              distanceKm: routed.distanceKm,
              durationMin: routed.durationMin,
              coordWarning: routed.coordWarning,
            };
          }

          return {
            ...customer,
            distanceKm: null,
            durationMin: null,
            coordWarning: false,
          };
        }),
      );

      setMessage("전체 경로 최적화 완료");
    } catch (err: any) {
      setMessage(err.message || "API 호출 실패");
    }
  };

  useEffect(() => {
    if (priorityRecalcKey === 0) return;

    const timer = window.setTimeout(() => {
      sortDispatch();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [priorityRecalcKey]);

  const totalDistance = selectedCustomers.reduce((sum, c) => {
    return sum + (c.distanceKm ?? 0);
  }, 0);

  const totalOrderCount = selectedCustomers.reduce((sum, c) => {
    return sum + (orderCounts[c.id] ?? 0);
  }, 0);

  const getEtaMin = (targetIndex: number) => {
    if (targetIndex < 0) return null;

    const startedIndex = selectedCustomers.findIndex(
      (customer) => customer.startedAt,
    );
    const baseIndex = startedIndex >= 0 ? startedIndex + 1 : 0;

    if (targetIndex < baseIndex) return 0;

    let total = 0;

    for (let i = baseIndex; i <= targetIndex; i++) {
      const customer = selectedCustomers[i];
      total += customer.durationMin ?? 0;

      if (i < targetIndex) {
        total += DEFAULT_UNLOADING_MIN;
      }
    }

    return Math.round(total);
  };

  const formatMin = (minutes: number | null) => {
    if (minutes == null) return "미계산";
    if (minutes <= 0) return "도착/진행중";

    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;

    if (hour <= 0) return `${min}분 후`;
    if (min === 0) return `${hour}시간 후`;
    return `${hour}시간 ${min}분 후`;
  };

  const updateSelectedCustomerField = (
    id: number,
    field: "assignedTo" | "unloadingMin",
    value: string | number,
  ) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, [field]: value } : customer,
      ),
    );
  };

  useEffect(() => {
    try {
      const mobileDispatch: MobileDispatchItem[] = selectedCustomers
        .filter((customer) => customer.assignedTo)
        .map((customer, index) => ({
          id: customer.id,
          order: index + 1,
          area: customer.area.replace("전남 ", ""),
          customer: customer.name,
          count: orderCounts[customer.id] ?? 0,
          assignedTo: customer.assignedTo ?? "",
          distanceKm: customer.distanceKm ?? null,
          durationMin: customer.durationMin ?? null,
          etaMin: getEtaMin(index),
          startedAt: customer.startedAt ?? null,
          unloadingMin: DEFAULT_UNLOADING_MIN,
        }));

      localStorage.setItem(MOBILE_DISPATCH_KEY, JSON.stringify(mobileDispatch));
    } catch {
      // 모바일 배차 저장 실패 시 화면은 그대로 유지
    }
  }, [selectedCustomers, orderCounts]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      try {
        const saved = localStorage.getItem(MOBILE_DISPATCH_KEY);
        if (!saved) return;

        const mobileDispatch = JSON.parse(saved) as MobileDispatchItem[];
        const startedMap = new Map(
          mobileDispatch.map((item) => [item.id, item.startedAt ?? null]),
        );

        setCustomers((prev) =>
          prev.map((customer) =>
            startedMap.has(customer.id)
              ? { ...customer, startedAt: startedMap.get(customer.id) ?? null }
              : customer,
          ),
        );
      } catch {
        // 모바일 상태 동기화 실패 시 무시
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const copyText = `총 거리: ${Math.round(totalDistance * 10) / 10}km / 총수량: ${totalOrderCount}장

${selectedCustomers
  .map((c, i) => {
    const count = orderCounts[c.id] ?? 0;
    const countText = count > 0 ? ` ${count}장${c.forklift ? " 지게발" : ""}` : c.forklift ? " 지게발" : "";
    return `${i + 1}. ${c.area.replace("전남 ", "")} ${c.name}${countText}`;
  })
  .join("\n")}`;

  const getCurrentSlotTimeText = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${month}.${day} ${hour}:${minute}`;
  };

  const makeDispatchSlotCopyText = (slotNumber: number, items: SavedDispatchItem[], driverName: string) => {
    const totalCount = items.reduce((sum, item) => sum + (item.count ?? 0), 0);
    const nameText = driverName.trim() || "배차자미입력";

    return `[배차${slotNumber} - ${nameText} / 총 ${totalCount}장]\n${items
      .sort((a, b) => a.order - b.order)
      .map((item, index) => {
        const countText = `${item.count ?? 0}장`;
        return `${index + 1}. ${item.area} ${item.name} ${countText}${item.forklift ? " 지게발" : ""}`;
      })
      .join("\n")}`;
  };

  const completeDispatch = () => {
    if (selectedCustomers.length === 0) {
      alert("완료할 선택 업체가 없습니다.");
      return;
    }

    const grouped = new Map<DispatchSlotNumber, Customer[]>();
    grouped.set(selectedDispatchNumber, selectedCustomers);

    const nowText = getCurrentSlotTimeText();

    setDispatchSlots((prev) => {
      const nextSlots = [...prev];

      grouped.forEach((groupCustomers, slotNumber) => {
        const existingSlot = nextSlots.find((slot) => slot.slot === slotNumber);
        const existingItems = existingSlot?.items ?? [];
        const startOrder = existingItems.length;
        const newItems: SavedDispatchItem[] = groupCustomers.map((customer, index) => ({
          id: customer.id,
          order: startOrder + index + 1,
          area: customer.area.replace("전남 ", ""),
          name: customer.name,
          grade: customer.grade,
          count: orderCounts[customer.id] ?? 0,
          forklift: Boolean(customer.forklift),
          distanceKm: customer.distanceKm ?? null,
          durationMin: customer.durationMin ?? null,
          etaMin: getEtaMin(selectedCustomers.findIndex((item) => item.id === customer.id)),
        }));

        const mergedItems = [...existingItems, ...newItems];
        const driverName = existingSlot?.driverName ?? dispatchDriverNames[slotNumber] ?? "";
        const totalDistance = Math.round(
          mergedItems.reduce((sum, item) => sum + (item.distanceKm ?? 0), 0) * 10,
        ) / 10;
        const totalOrderCount = mergedItems.reduce((sum, item) => sum + (item.count ?? 0), 0);
        const copyTextForSlot = makeDispatchSlotCopyText(slotNumber, mergedItems, driverName);

        const savedSlot: SavedDispatchSlot = {
          slot: slotNumber,
          createdAt: existingSlot?.createdAt ?? nowText,
          items: mergedItems,
          totalDistance,
          totalOrderCount,
          copyText: copyTextForSlot,
          driverName,
        };

        const existingIndex = nextSlots.findIndex((slot) => slot.slot === slotNumber);
        if (existingIndex >= 0) nextSlots[existingIndex] = savedSlot;
        else nextSlots.push(savedSlot);
      });

      return nextSlots.sort((a, b) => a.slot - b.slot);
    });

    setMessage(`선택 업체 배차${selectedDispatchNumber} 지정 완료`);
  };

  const completeDispatchSlot = (slotNumber: number) => {
    const slot = dispatchSlots.find((item) => item.slot === slotNumber);
    if (!slot || slot.items.length === 0) {
      alert(`배차${slotNumber}에 지정된 업체가 없습니다.`);
      return;
    }

    const driverName = dispatchDriverNames[slotNumber]?.trim() || slot.driverName?.trim() || "";

    if (!driverName) {
      alert("배차자 이름을 입력하세요.");
      return;
    }

    const nextCopyText = makeDispatchSlotCopyText(slotNumber, slot.items, driverName);

    setDispatchSlots((prev) =>
      prev.map((item) =>
        item.slot === slotNumber
          ? {
              ...item,
              driverName,
              totalOrderCount: item.items.reduce((sum, savedItem) => sum + (savedItem.count ?? 0), 0),
              copyText: nextCopyText,
            }
          : item,
      ),
    );

    setDispatchCopyText(nextCopyText);
    setMessage(`배차${slotNumber} 카톡 붙여넣기 입력 완료`);
  };

  const deleteDispatchSlot = (slotNumber: number) => {
    if (!confirm(`배차${slotNumber} 안에 있는 내용만 삭제할까요?`)) return;

    setDispatchSlots((prev) => prev.filter((slot) => slot.slot !== slotNumber));
    setDispatchDriverNames((prev) => {
      const next = { ...prev };
      delete next[slotNumber];
      return next;
    });
    setDispatchCopyText((prev) =>
      prev.startsWith(`[배차${slotNumber} -`) ? "" : prev,
    );
    setMessage(`배차${slotNumber} 내용 삭제 완료`);
  };

  const copyDispatchSlot = async (slot: SavedDispatchSlot) => {
    await navigator.clipboard.writeText(slot.copyText);
    alert(`배차${slot.slot} 카카오톡 복사용 목록이 복사되었습니다.`);
  };

  const applyDispatchSlotToSelectedList = (slot: SavedDispatchSlot) => {
    const sortedItems = [...slot.items].sort((a, b) => a.order - b.order);
    const slotItemMap = new Map(sortedItems.map((item) => [item.id, item]));

    setCustomers((prev) =>
      prev.map((customer) => {
        const savedItem = slotItemMap.get(customer.id);

        if (!savedItem) {
          return {
            ...customer,
            selected: false,
            productionDoor: false,
            urgent: false,
            forklift: false,
            priorityFirst: false,
            distanceKm: null,
            durationMin: null,
            coordWarning: false,
            startedAt: null,
          };
        }

        return {
          ...customer,
          selected: true,
          forklift: savedItem.forklift,
          distanceKm: savedItem.distanceKm,
          durationMin: savedItem.durationMin,
          coordWarning: false,
          startedAt: null,
          unloadingMin: DEFAULT_UNLOADING_MIN,
        };
      }),
    );

    setOrderCounts((prev) => {
      const next: Record<number, number> = { ...prev };
      sortedItems.forEach((item) => {
        next[item.id] = item.count ?? 0;
      });
      return next;
    });

    setPendingOrderIds((prev) => {
      const next = [...prev];
      sortedItems.forEach((item) => {
        if (!next.includes(item.id)) next.push(item.id);
      });
      return next;
    });

    setPendingOrderTimes((prev) => {
      const nowText = getCurrentTimeText();
      const next = { ...prev };
      sortedItems.forEach((item) => {
        if (!next[item.id]) next[item.id] = nowText;
      });
      return next;
    });

    setRouteOrderIds(sortedItems.map((item) => item.id));
    setSelectedDispatchNumber(slot.slot as DispatchSlotNumber);
    setDispatchCopyText(slot.copyText);
    setMessage(`배차${slot.slot} 내용을 선택리스트와 미배차 대기함에 불러왔습니다.`);
  };

  const updateDispatchSlotByKakao = (
    customer: Customer,
    count: number,
    action: "add" | "cancel",
  ) => {
    const targetSlot = dispatchSlots.find((slot) =>
      slot.items.some((item) => item.id === customer.id),
    );

    if (!targetSlot) return false;

    let nextCountForCustomer = 0;
    let removed = false;

    setDispatchSlots((prev) =>
      prev
        .map((slot) => {
          if (slot.slot !== targetSlot.slot) return slot;

          const nextItems = slot.items
            .map((item) => {
              if (item.id !== customer.id) return item;

              const currentCount = item.count ?? 0;
              const nextCount =
                action === "cancel"
                  ? count > 0
                    ? Math.max(0, currentCount - count)
                    : 0
                  : currentCount + count;

              nextCountForCustomer = nextCount;
              removed = action === "cancel" && nextCount <= 0;

              return { ...item, count: nextCount };
            })
            .filter((item) => item.id !== customer.id || (item.count ?? 0) > 0)
            .map((item, index) => ({ ...item, order: index + 1 }));

          const totalDistance =
            Math.round(
              nextItems.reduce((sum, item) => sum + (item.distanceKm ?? 0), 0) *
                10,
            ) / 10;
          const totalOrderCount = nextItems.reduce(
            (sum, item) => sum + (item.count ?? 0),
            0,
          );
          const nextCopyText = makeDispatchSlotCopyText(
            slot.slot,
            nextItems,
            slot.driverName ?? dispatchDriverNames[slot.slot] ?? "",
          );

          return {
            ...slot,
            items: nextItems,
            totalDistance,
            totalOrderCount,
            copyText: nextCopyText,
          };
        })
        .filter((slot) => slot.items.length > 0),
    );

    setOrderCounts((prev) => {
      const next = { ...prev };
      if (removed) delete next[customer.id];
      else next[customer.id] = nextCountForCustomer;
      return next;
    });

    if (removed) {
      setPendingOrderIds((prev) => prev.filter((id) => id !== customer.id));
      setRouteOrderIds((prev) => prev.filter((id) => id !== customer.id));
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                selected: false,
                productionDoor: false,
                urgent: false,
                forklift: false,
                priorityFirst: false,
                distanceKm: null,
                durationMin: null,
                coordWarning: false,
                startedAt: null,
              }
            : item,
        ),
      );
    } else {
      setPendingOrderIds((prev) =>
        prev.includes(customer.id) ? prev : [...prev, customer.id],
      );
      setPendingOrderTimes((prev) =>
        prev[customer.id]
          ? prev
          : { ...prev, [customer.id]: getCurrentTimeText() },
      );
    }

    const actionText = action === "cancel" ? "취소" : "추가";
    const countText = count > 0 ? `${count}장` : "전체";
    setMessage(
      `배차${targetSlot.slot} ${customer.area.replace("전남 ", "")} ${customer.name} ${actionText} ${countText} 반영 완료`,
    );
    setKakaoText("");
    return true;
  };

  const normalizeText = (value: string) => {
    return value
      .replace(/주식회사|유한회사|유\)|\(유\)|㈜|주\)/g, "")
      .replace(/[()&.·\-_\/\s]/g, "")
      .toLowerCase();
  };

  const parseJangCount = (text: string) => {
    return text.split(/\r?\n/).reduce((sum, rawLine) => {
      const line = rawLine.trim();
      if (!line) return sum;

      // 날짜/주소/납기/급한 요청 줄은 수량 계산 제외
      if (/^\d{1,2}\.\d{1,2}$/.test(line)) return sum;
      if (/주소|납기|확인|급|오전|오후|배송|도착/.test(line)) return sum;

      const cleanedLine = line
        // 제외 품목 + 수량까지 제거
        .replace(/합판우라\s*\d+\s*장/gi, "")
        .replace(/\d+\s*장\s*합판우라/gi, "")
        .replace(/양면우라\s*\d+\s*장/gi, "")
        .replace(/\d+\s*장\s*양면우라/gi, "")
        .replace(/우라\s*\d+\s*장/gi, "")
        .replace(/\d+\s*장\s*우라/gi, "")
        .replace(/스티커\s*\d+\s*장/gi, "")
        .replace(/\d+\s*장\s*스티커/gi, "")
        .replace(/피스마개\s*\d+\s*장/gi, "")
        .replace(/\d+\s*장\s*피스마개/gi, "")
        .replace(/mdf\s*\d+\s*장/gi, "")
        .replace(/\d+\s*장\s*mdf/gi, "")

        // 줄 단위 품목 제거
        .replace(/엣지\s*\d+\s*줄/gi, "")
        .replace(/\d+\s*줄/gi, "")

        // 단어만 남은 경우 제거
        .replace(/2.7t/gi, "")
        .replace(/양면우라/gi, "")
        .replace(/합판우라/gi, "")
        .replace(/피스마개/gi, "")
        .replace(/스티커/gi, "")
        .replace(/mdf/gi, "")
        .replace(/우라/gi, "");

      const matches = [...cleanedLine.matchAll(/(\d+)\s*장/g)];
      return (
        sum + matches.reduce((lineSum, match) => lineSum + Number(match[1]), 0)
      );
    }, 0);
  };

  const isCompletedDispatchSlot = (slotNumber: number) => {
    const slot = dispatchSlots.find((item) => item.slot === slotNumber);
    return Boolean(slot?.driverName?.trim());
  };

  const renderCompletedDispatchBoxes = (slotNumbers: number[]) => {
    return (
      <div style={completedDispatchPanel}>
        <h3 style={sectionTitle}>배차완료</h3>
        <div style={completedDispatchGrid}>
          {slotNumbers.map((slotNumber) => {
            const slot = dispatchSlots.find((item) => item.slot === slotNumber);
            const completed = isCompletedDispatchSlot(slotNumber);

            return (
              <button
                key={`completed-${slotNumber}`}
                type="button"
                onClick={() => {
                  if (slot) {
                    applyDispatchSlotToSelectedList(slot);
                    setOpenedCompletedSlotNumber(slotNumber);
                  }
                }}
                style={{
                  ...completedDispatchBox,
                  cursor: slot ? "pointer" : "default",
                  opacity: slot ? 1 : 0.75,
                }}
              >
                <div style={completedDispatchHeader}>
                  <strong>배차{slotNumber}</strong>
                  <span>{completed ? slot?.driverName : "대기"}</span>
                </div>
                <p style={completedDispatchEmpty}>{completed ? "상세보기" : "완료 전"}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const openedCompletedSlot = openedCompletedSlotNumber == null
    ? undefined
    : dispatchSlots.find((slot) => slot.slot === openedCompletedSlotNumber);


  const findCustomerFromKakaoText = (text: string) => {
    const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? text;
    const areaKeywords = [
      "목포",
      "광주",
      "순천",
      "나주",
      "해남",
      "영광",
      "무안",
      "진도",
    ];
    const foundArea = areaKeywords.find((area) => firstLine.includes(area));

    const cleanInput = (value: string) => {
      return value
        .replace(/앱|발주|추가|주문|오더|취소/g, "")
        .replace(/\d+\s*장/g, "")
        .replace(/\d+\.\d+/g, "")
        .replace(/\d{1,2}월\s*\d{1,2}일/g, "")
        .replace(/\d{1,2}\/\d{1,2}/g, "")
        .replace(/[0-9]/g, "")
        .trim();
    };

    const removeBusinessWords = (value: string) => {
      return value.replace(
        /퍼니처|퍼니쳐|주방가구|씽크공장|씽크|싱크|가구|공장|산업|유통|디자인|하우징|메이드|하우스|종합|주방|kitchen/g,
        "",
      );
    };

    const makeAliasKeywords = (customerName: string) => {
      const normalizedName = normalizeText(customerName);
      const shortName = removeBusinessWords(normalizedName);
      const manualAliases: Record<string, string[]> = {
        "리빙&성민": ["리빙", "성민"],
        "주식회사 힐링캠프": ["힐링", "캠프", "힐링캠프"],
        "채움": ["채움"],
        "채움퍼니처": ["채움"],
        "주식회사 미광퍼니쳐": ["미광"],
        "미광퍼니쳐": ["미광"],
      };

      const aliases = new Set<string>([
        normalizedName,
        shortName,
        ...(manualAliases[customerName] ?? []),
      ]);

      for (let i = 0; i <= shortName.length - 2; i++) {
        aliases.add(shortName.slice(i, i + 2));
      }

      return [...aliases]
        .map((alias) => normalizeText(alias))
        .filter((alias) => alias.length >= 2);
    };

    const firstLineWithoutArea = areaKeywords.reduce(
      (value, area) => value.replaceAll(area, ""),
      cleanInput(firstLine),
    );

    const inputName = normalizeText(firstLineWithoutArea);
    const shortInputName = removeBusinessWords(inputName);

    if (inputName.length < 2 && shortInputName.length < 2) return undefined;

    const candidates = customers.filter((customer) => {
      if (!foundArea) return true;
      return (
        customer.area.includes(foundArea) ||
        customer.address.includes(foundArea)
      );
    });

    let bestCustomer: Customer | undefined;
    let bestScore = 0;

    for (const customer of candidates) {
      const name = normalizeText(customer.name);
      const shortName = removeBusinessWords(name);

      let score = 0;

      // 정확/강한 매칭 우선
      if (inputName === name) score = 100;
      else if (inputName.includes(name)) score = 90;
      else if (name.includes(inputName)) score = 80;
      else if (shortInputName.length >= 2 && shortInputName === shortName)
        score = 75;
      else if (shortInputName.length >= 2 && shortName.includes(shortInputName))
        score = 70;
      else if (shortName.length >= 2 && shortInputName.includes(shortName))
        score = 65;

      const aliasMatched = makeAliasKeywords(customer.name).some((alias) => {
        return inputName.includes(alias) || shortInputName.includes(alias);
      });

      if (aliasMatched) {
        score = Math.max(score, 85);
      }

      if (score > bestScore) {
        bestScore = score;
        bestCustomer = customer;
      }
    }

    return bestScore >= 65 ? bestCustomer : undefined;
  };

  const getCurrentTimeText = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  };

  const applyKakaoText = () => {
    const count = parseJangCount(kakaoText);
    const matchedCustomer = findCustomerFromKakaoText(kakaoText);
    const isCancel = kakaoText.includes("취소");
    const isAdd = kakaoText.includes("추가");

    if (!matchedCustomer) {
      setMessage(
        count > 0
          ? `총 ${count}장 인식 / 업체 자동매칭 실패`
          : "업체 자동매칭 실패",
      );
      return;
    }

    setSelectedArea(matchedCustomer.area);
    setForm((prev) => ({ ...prev, area: matchedCustomer.area }));

    if (isCancel) {
      const updatedSlot = updateDispatchSlotByKakao(matchedCustomer, count, "cancel");

      if (!updatedSlot) {
        setOrderCounts((prev) => {
          const currentCount = prev[matchedCustomer.id] ?? 0;
          const nextCount = count > 0 ? Math.max(0, currentCount - count) : 0;
          const next = { ...prev };
          if (nextCount <= 0) delete next[matchedCustomer.id];
          else next[matchedCustomer.id] = nextCount;
          return next;
        });

        if (count <= 0) {
          setPendingOrderIds((prev) =>
            prev.filter((pendingId) => pendingId !== matchedCustomer.id),
          );
        }

        setMessage(
          count > 0
            ? `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 취소 ${count}장 반영 완료`
            : `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 전체 취소 완료`,
        );
        setKakaoText("");
      }
      return;
    }

    const actionCount = count > 0 ? count : 0;

    if (isAdd && actionCount > 0) {
      const updatedSlot = updateDispatchSlotByKakao(matchedCustomer, actionCount, "add");
      if (updatedSlot) return;
    }

    if (count > 0) {
      setOrderCounts((prev) => ({
        ...prev,
        [matchedCustomer.id]: (prev[matchedCustomer.id] ?? 0) + count,
      }));
    }

    if (!matchedCustomer.selected) {
      setPendingOrderIds((prev) =>
        prev.includes(matchedCustomer.id)
          ? prev
          : [...prev, matchedCustomer.id],
      );
      setPendingOrderTimes((prev) =>
        prev[matchedCustomer.id]
          ? prev
          : { ...prev, [matchedCustomer.id]: getCurrentTimeText() },
      );
    }

    setMessage(
      matchedCustomer.selected
        ? count > 0
          ? `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 추가 ${count}장 반영 완료`
          : `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 추가 확인 완료`
        : count > 0
          ? `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} ${count}장 미배차 등록 완료`
          : `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 업체명만 미배차 등록 완료`,
    );
    setKakaoText("");
  };

  const movePendingToDispatch = (id: number) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, selected: true } : customer,
      ),
    );
    setPendingOrderIds((prev) => prev.filter((pendingId) => pendingId !== id));
    setPendingOrderTimes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRouteOrderIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setMessage("미배차에서 배차리스트로 이동 완료");
  };

  const deletePendingOrder = (id: number) => {
    setPendingOrderIds((prev) => prev.filter((pendingId) => pendingId !== id));
    setPendingOrderTimes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOrderCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMessage("미배차 발주 삭제 완료");
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(dispatchCopyText || copyText);
    alert("카카오톡 복사용 목록이 복사되었습니다.");
  };

  const saveCustomer = () => {
    if (!form.name.trim() || !form.address.trim()) {
      alert("업체명과 주소를 입력하세요.");
      return;
    }

    const fixedAddress = normalizeAddress(form.address);

    if (form.id) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === form.id
            ? {
                ...c,
                area: form.area,
                name: form.name,
                address: fixedAddress,
                grade: form.grade,
                distanceKm: null,
                durationMin: null,
                coordWarning: false,
              }
            : c,
        ),
      );
    } else {
      setCustomers((prev) => [
        ...prev,
        {
          id: Date.now(),
          area: form.area,
          name: form.name,
          address: fixedAddress,
          grade: form.grade,
          selected: false,
          productionDoor: false,
          urgent: false,
          forklift: false,
          priorityFirst: false,
          distanceKm: null,
          durationMin: null,
          coordWarning: false,
          assignedTo: "",
          startedAt: null,
          unloadingMin: DEFAULT_UNLOADING_MIN,
        },
      ]);
    }

    setForm({
      id: 0,
      area: selectedArea,
      name: "",
      address: "",
      grade: "white",
    });
  };

  const editCustomer = (customer: Customer) => {
    setForm({
      id: customer.id,
      area: customer.area,
      name: customer.name,
      address: customer.address,
      grade: customer.grade,
    });
  };

  const deleteCustomer = (id: number) => {
    if (!confirm("이 업체를 삭제할까요?")) return;
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setRouteOrderIds((prev) => prev.filter((routeId) => routeId !== id));
    setPendingOrderIds((prev) => prev.filter((pendingId) => pendingId !== id));
    setPendingOrderTimes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setOrderCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resetForm = () => {
    setForm({
      id: 0,
      area: selectedArea,
      name: "",
      address: "",
      grade: "white",
    });
  };

  const recalcManualRoute = async (orderedIds: number[]) => {
    try {
      setMessage("변경된 순서 기준 거리 재계산 중...");

      const orderedCustomers = orderedIds
        .map((id) => customers.find((c) => c.id === id && c.selected))
        .filter(Boolean) as Customer[];

      if (orderedCustomers.length === 0) return;

      let currentCoord = await geocode(startAddress, "출발지", "장성");
      const sectionMap = new Map<
        number,
        { distanceKm: number; durationMin: number }
      >();

      for (const customer of orderedCustomers) {
        const targetCoord = await geocode(
          customer.address,
          customer.name,
          customer.area,
        );
        const result = await getDistance(currentCoord, targetCoord);

        sectionMap.set(customer.id, {
          distanceKm: Math.round(result.distanceKm * 10) / 10,
          durationMin: result.durationMin,
        });

        currentCoord = targetCoord;
      }

      setCustomers((prev) =>
        prev.map((customer) => {
          const section = sectionMap.get(customer.id);

          if (!customer.selected) {
            return {
              ...customer,
              distanceKm: null,
              durationMin: null,
              coordWarning: false,
            };
          }

          if (!section) return customer;

          return {
            ...customer,
            distanceKm: section.distanceKm,
            durationMin: section.durationMin,
            coordWarning:
              section.distanceKm <= 0.2 || section.distanceKm >= 180,
          };
        }),
      );

      setMessage("변경된 순서 기준 거리 재계산 완료");
    } catch (err: any) {
      setMessage(err.message || "순서 변경 거리 재계산 실패");
    }
  };

  const handleDropSelected = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;

    const selected = [...selectedCustomers];

    const fromIndex = selected.findIndex((c) => c.id === draggedId);
    const toIndex = selected.findIndex((c) => c.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...selected];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const nextOrderIds = reordered.map((c) => c.id);

    setRouteOrderIds(nextOrderIds);
    setDraggedId(null);
    await recalcManualRoute(nextOrderIds);
  };

  const changeMiddleCategory = (category: "목포" | "광주" | "순천") => {
    setMiddleCategory(category);

    if (category === "목포") {
      setSelectedArea("전남 목포");
      setForm((prev) => ({ ...prev, area: "전남 목포" }));
    } else {
      setSelectedArea(category);
      setForm((prev) => ({ ...prev, area: category }));
    }
  };

  const customerSearchResults = customerSearch.trim()
    ? customers
        .filter((customer) => {
          const keyword = normalizeText(customerSearch);
          const target = normalizeText(
            `${customer.area} ${customer.name} ${customer.address}`,
          );
          return target.includes(keyword);
        })
        .slice(0, 10)
    : [];

  const selectCustomerForEdit = (customer: Customer) => {
    editCustomer(customer);
    setSelectedArea(customer.area);
    setForm({
      id: customer.id,
      area: customer.area,
      name: customer.name,
      address: customer.address,
      grade: customer.grade,
    });
    setCustomerSearch("");
  };

  return (
    <main style={page}>
      <div style={topButtonRow}>
        <div style={startInlineBox}>
          <label style={startInlineLabel}>출발지</label>
          <input
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            onBlur={() => setStartAddress((prev) => normalizeAddress(prev))}
            style={startInlineInput}
          />
        </div>

        <button onClick={sortDispatch} style={primaryButton}>
          거리 계산해서 배차 정렬
        </button>

        <button onClick={resetDispatch} style={resetButton}>
          배차 초기화
        </button>
      </div>

      {message && <div style={messageBox}>{message}</div>}

      <div style={layout}>
        <section>
          <div style={panelLarge}>
            <h3 style={sectionTitle}>미배차 대기함</h3>
          <p style={hint}>카톡 등록 후 체크하면 배차리스트로 이동</p>

          <div style={pendingCategoryTabs}>
            {(["목포", "광주", "순천"] as const).map((category) => {
              const hasPending = hasPendingByCategory(category);
              const active = pendingCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setPendingCategory(category)}
                  style={{
                    ...pendingCategoryButton,
                    background: active
                      ? hasPending
                        ? "#dc2626"
                        : "#111827"
                      : "#ffffff",
                    color: active
                      ? "#ffffff"
                      : hasPending
                        ? "#dc2626"
                        : "#111827",
                    borderColor: hasPending ? "#dc2626" : "#111827",
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {pendingCustomers.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 12 }}>
              {pendingCategory} 미배차 발주가 없습니다.
            </p>
          )}

          {pendingCustomers.map((customer) => {
            const count = orderCounts[customer.id] ?? 0;
            const registeredTime = pendingOrderTimes[customer.id];

            return (
              <div key={customer.id} style={pendingRow}>
                <label style={pendingCheckItem}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => movePendingToDispatch(customer.id)}
                  />
                  <span
                    style={{ color: getColor(customer.grade), fontWeight: 900 }}
                  >
                    {registeredTime ? `${registeredTime} ` : ""}
                    {customer.area.replace("전남 ", "")} {customer.name}
                  </span>
                </label>

                <div style={pendingActionBox}>
                  <span style={pendingCount}>
                    {count > 0 ? `${count}장` : "수량없음"}
                  </span>
                  <button
                    type="button"
                    onClick={() => deletePendingOrder(customer.id)}
                    style={pendingDeleteButton}
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
          </div>

          <div style={dispatchAssignPanel}>
            <h3 style={sectionTitle}>배차지정</h3>
            <p style={hint}>선택리스트에서 배차1~배차8 지정 후 완료하면 이곳으로 이동합니다.</p>

            <div style={dispatchSlotGrid}>
              {Array.from({ length: MAX_DISPATCH_SLOTS }, (_, index) => index + 1).map(
                (slotNumber) => {
                  const slot = dispatchSlots.find((item) => item.slot === slotNumber);
                  return (
                    <div
                      key={slotNumber}
                      style={{
                        ...dispatchSlotBox,
                        cursor: slot ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (slot) applyDispatchSlotToSelectedList(slot);
                      }}
                    >
                      <div style={dispatchSlotHeader}>
                        <strong>배차{slotNumber}</strong>
                        <div style={dispatchSlotHeaderRight}>
                          {slot ? <span style={dispatchSlotTime}>{slot.createdAt}</span> : null}
                          {slot ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDispatchSlot(slotNumber);
                              }}
                              style={dispatchSlotDeleteButton}
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {!slot ? (
                        <p style={dispatchSlotEmpty}>비어있음</p>
                      ) : (
                        <>
                          <div style={dispatchSlotList}>
                            {slot.items.map((item) => (
                              <div key={`${slot.slot}-${item.id}`} style={dispatchSlotItem}>
                                {item.order}. {item.area} {item.name}
                                {` ${item.count ?? 0}장`}
                                {item.forklift ? " 지게발" : ""}
                              </div>
                            ))}
                          </div>

                          <input
                            value={dispatchDriverNames[slotNumber] ?? slot.driverName ?? ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setDispatchDriverNames((prev) => ({
                                ...prev,
                                [slotNumber]: e.target.value,
                              }))
                            }
                            placeholder="배차자 이름"
                            style={dispatchDriverInput}
                          />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              completeDispatchSlot(slotNumber);
                            }}
                            style={dispatchSlotCompleteButton}
                          >
                            완료
                          </button>
                        </>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section style={panelMiddle}>
          <div style={selectedPanelHeader}>
            <div>
              <h3 style={sectionTitle}>선택 리스트</h3>
              <p style={hint}>드래그해서 순서 변경</p>
            </div>

            <div style={selectedDispatchTopControl}>
              <select
                value={selectedDispatchNumber}
                onChange={(e) =>
                  setSelectedDispatchNumber(Number(e.target.value) as DispatchSlotNumber)
                }
                style={selectedDispatchTopSelect}
              >
                {Array.from({ length: MAX_DISPATCH_SLOTS }, (_, slotIndex) => {
                  const slotNumber = slotIndex + 1;
                  return (
                    <option key={slotNumber} value={slotNumber}>
                      배차{slotNumber}
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={completeDispatch}
                style={completeDispatchButton}
              >
                완료
              </button>
            </div>
          </div>

          {selectedCustomers.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 12 }}>
              선택된 거래처가 없습니다.
            </p>
          )}

          {selectedCustomers.map((customer, index) => (
            <div
              key={customer.id}
              draggable
              onDragStart={() => setDraggedId(customer.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropSelected(customer.id)}
              style={selectedCard}
            >
              <div style={selectedTitleRow}>
                <strong style={{ color: getColor(customer.grade) }}>
                  {index + 1}. {customer.area} {customer.name}
                </strong>
                <label style={priorityInlineCheck} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={Boolean(customer.priorityFirst)}
                    onChange={(e) => updatePriorityFirst(customer.id, e.target.checked)}
                  />
                  <span>우선순위</span>
                </label>
              </div>
              <div
                style={{
                  ...distanceText,
                  color: customer.coordWarning ? "#dc2626" : "#475569",
                  fontWeight: customer.coordWarning ? 900 : 400,
                }}
              >
                거리{" "}
                {customer.distanceKm == null
                  ? "미계산"
                  : `${customer.distanceKm}km`}
                {customer.durationMin == null
                  ? ""
                  : ` / 구간 ${customer.durationMin}분`}
                {customer.coordWarning ? " / 거리확인필요" : ""}
              </div>

              <div style={etaText}>
                상태:{" "}
                {customer.startedAt ? `${customer.startedAt} 출발` : "대기중"} /
                예상도착: {formatMin(getEtaMin(index))}
              </div>

            </div>
          ))}
        </section>

        <section>
          <div style={kakaoBox}>
            <h3 style={sectionTitle}>카톡 붙여넣기</h3>
            <textarea
              value={kakaoText}
              onChange={(e) => setKakaoText(e.target.value)}
              placeholder={
                "예) 목포 채움\n리치펄화이트 3장\n글로시라이트그레이 4장, 엣지 1줄"
              }
              style={kakaoTextarea}
            />
            <button onClick={applyKakaoText} style={kakaoButton}>
              카톡 내용 자동등록
            </button>
            <div style={kakaoHint}>
              숫자+장만 합산 / 장이 없어도 업체명만 등록 / 줄, 2.7t, 양면우라,
              합판우라, 피스마개, 스티커, mdf, 우라는 무시
            </div>
          </div>

          <div style={copyPanel}>
            <h3 style={sectionTitle}>카톡 복사용 & 배차지정</h3>
            <p style={copyInfo}>
              총 거리: {Math.round(totalDistance * 10) / 10}km / 총수량:{" "}
              {totalOrderCount}장
            </p>

            <button onClick={copyToClipboard} style={copyButton}>
              복사하기
            </button>

            <pre style={copyBox}>{dispatchCopyText || copyText}</pre>
          </div>

          {renderCompletedDispatchBoxes([1, 2, 3, 4, 5, 6, 7, 8])}

          {openedCompletedSlot && (
            <>
              <div
                style={drawerBackdrop}
                onClick={() => setOpenedCompletedSlotNumber(null)}
              />
              <aside style={completedDetailDrawer}>
                <div style={drawerHeader}>
                  <h3 style={sectionTitle}>
                    배차{openedCompletedSlot.slot} {openedCompletedSlot.driverName || ""}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenedCompletedSlotNumber(null)}
                    style={drawerCloseButton}
                  >
                    닫기
                  </button>
                </div>

                <div style={completedDetailList}>
                  {openedCompletedSlot.items
                    .sort((a, b) => a.order - b.order)
                    .map((item) => (
                      <div key={`detail-${openedCompletedSlot.slot}-${item.id}`} style={selectedCard}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "#111827" }}>
                          {item.order}. {item.area} {item.name}
                        </div>
                        <div style={distanceText}>
                          {item.distanceKm == null ? "미계산" : `${item.distanceKm}km`}
                          {item.durationMin == null ? "" : ` / 구간 ${item.durationMin}분`}
                        </div>
                        <div style={etaText}>
                          예상도착: {formatMin(item.etaMin)}
                        </div>
                      </div>
                    ))}
                </div>
              </aside>
            </>
          )}

          <button
            type="button"
            onClick={() => setAdminPanelOpen(true)}
            style={adminFloatingButton}
          >
            ⚙ 업체관리
          </button>

          {adminPanelOpen && (
            <>
              <div
                style={drawerBackdrop}
                onClick={() => setAdminPanelOpen(false)}
              />
              <aside style={adminDrawer}>
                <div style={drawerHeader}>
                  <h3 style={sectionTitle}>수정 / 등록</h3>
                  <button
                    type="button"
                    onClick={() => setAdminPanelOpen(false)}
                    style={drawerCloseButton}
                  >
                    닫기
                  </button>
                </div>

                <label style={label}>업체 검색</label>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="예) 힐링캠프, 미광, 리빙성민"
                  style={input}
                />

                {customerSearch.trim() && (
                  <div style={searchResultBox}>
                    {customerSearchResults.length === 0 && (
                      <div style={searchEmpty}>검색된 업체가 없습니다.</div>
                    )}

                    {customerSearchResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => selectCustomerForEdit(customer)}
                        style={searchResultButton}
                      >
                        <span
                          style={{
                            color: getColor(customer.grade),
                            fontWeight: 900,
                          }}
                        >
                          {customer.area.replace("전남 ", "")} {customer.name}
                        </span>
                        <span style={searchAddress}>{customer.address}</span>
                      </button>
                    ))}
                  </div>
                )}

                <label style={label}>지역</label>
                <select
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  style={input}
                >
                  {[...areas, "광주", "순천"].map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </select>

                <label style={label}>업체명</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="업체명"
                  style={input}
                />

                <label style={label}>주소</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  onBlur={() =>
                    setForm((prev) => ({
                      ...prev,
                      address: normalizeAddress(prev.address),
                    }))
                  }
                  placeholder="주소"
                  style={input}
                />

                <label style={label}>등급 색상</label>
                <select
                  value={form.grade}
                  onChange={(e) =>
                    setForm({ ...form, grade: e.target.value as Grade })
                  }
                  style={input}
                >
                  <option value="white">white / 검정</option>
                  <option value="blue">blue / 파랑</option>
                  <option value="green">green / 초록</option>
                  <option value="amber">amber / 주황</option>
                  <option value="yellow">yellow / 노랑</option>
                  <option value="red">red / 빨강</option>
                </select>

                <button onClick={saveCustomer} style={saveButton}>
                  {form.id ? "수정 저장" : "신규 등록"}
                </button>

                <button onClick={resetForm} style={subButton}>
                  입력 초기화
                </button>

                {form.id !== 0 && (
                  <button
                    onClick={() => deleteCustomer(form.id)}
                    style={deleteButton}
                  >
                    현재 업체 삭제
                  </button>
                )}
              </aside>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: 14,
  background: "linear-gradient(135deg, #eef2f7 0%, #f8fafc 50%, #e5e7eb 100%)",
  color: "#111827",
  fontFamily:
    "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Segoe UI, sans-serif",
  fontSize: 12,
};

const startBox: React.CSSProperties = {
  maxWidth: 1600,
  margin: "0 auto 8px",
  padding: 10,
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
};

const startInlineBox: React.CSSProperties = {
  width: "33.333%",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 9px",
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxSizing: "border-box",
};

const startInlineLabel: React.CSSProperties = {
  flex: "0 0 auto",
  fontWeight: 900,
  fontSize: 11,
  color: "#334155",
};

const startInlineInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 12,
  color: "#111827",
};

const topButtonRow: React.CSSProperties = {
  maxWidth: 1600,
  margin: "0 auto",
  display: "flex",
  gap: 8,
};

const primaryButton: React.CSSProperties = {
  width: "33.333%",
  background: "#111827",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const resetButton: React.CSSProperties = {
  width: "33.333%",
  background: "#f8fafc",
  color: "#111827",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const messageBox: React.CSSProperties = {
  maxWidth: 1600,
  margin: "8px auto 0",
  padding: 8,
  borderRadius: 8,
  background: "#fff7ed",
  color: "#9a3412",
  fontWeight: 800,
  fontSize: 12,
};

const layout: React.CSSProperties = {
  maxWidth: 1600,
  margin: "10px auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
  alignItems: "start",
};

const panelLarge: React.CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  boxShadow: "0 6px 18px rgba(15,23,42,0.07)",
};

const panelMiddle: React.CSSProperties = {
  ...panelLarge,
  minHeight: 360,
};

const panelRight: React.CSSProperties = {
  ...panelLarge,
  marginTop: 10,
};

const adminFloatingButton: React.CSSProperties = {
  position: "fixed",
  right: 18,
  bottom: 18,
  zIndex: 40,
  padding: "11px 14px",
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(15,23,42,0.25)",
  fontSize: 12,
};

const drawerBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.32)",
  zIndex: 50,
};

const adminDrawer: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "min(420px, 92vw)",
  height: "100vh",
  overflowY: "auto",
  background: "#ffffff",
  borderLeft: "1px solid #e5e7eb",
  boxShadow: "-10px 0 28px rgba(15,23,42,0.18)",
  zIndex: 60,
  padding: 14,
  boxSizing: "border-box",
};

const drawerHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
};

const drawerCloseButton: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const copyPanel: React.CSSProperties = {
  ...panelLarge,
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 14,
  letterSpacing: "-0.2px",
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 800,
  fontSize: 11,
  marginBottom: 4,
  color: "#334155",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  marginBottom: 7,
  fontSize: 12,
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
};

const areaTabs: React.CSSProperties = {
  display: "flex",
  gap: 5,
  flexWrap: "wrap",
  marginBottom: 6,
};

const mainAreaButton: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const middleAreaButton: React.CSSProperties = {
  padding: "6px 11px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 12,
};

const areaButton: React.CSSProperties = {
  padding: "6px 9px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 12,
};

const customerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 7,
  padding: "7px 5px",
  borderBottom: "1px solid #eef2f7",
  fontSize: 12,
};

const checkItem: React.CSSProperties = {
  minWidth: 180,
};

const optionItem: React.CSSProperties = {
  fontSize: 11,
  color: "#334155",
};

const miniButton: React.CSSProperties = {
  marginLeft: "auto",
  padding: "4px 7px",
  borderRadius: 7,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 11,
};

const hint: React.CSSProperties = {
  marginTop: -4,
  marginBottom: 8,
  fontSize: 11,
  color: "#64748b",
};

const selectedCard: React.CSSProperties = {
  padding: 9,
  borderRadius: 10,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginBottom: 7,
  cursor: "grab",
  boxShadow: "0 3px 10px rgba(15,23,42,0.05)",
  fontSize: 12,
};


const selectedDispatchAssignBox: React.CSSProperties = {
  marginTop: 7,
  display: "grid",
  gap: 5,
};

const selectedDispatchButton: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 11,
};

const selectedDispatchPicker: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 4,
};

const selectedDispatchOptionButton: React.CSSProperties = {
  padding: "5px 4px",
  borderRadius: 7,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 10,
};


const selectedPanelHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
};

const completeDispatchButton: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: 9,
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const dispatchAssignPanel: React.CSSProperties = {
  ...panelLarge,
  marginTop: 10,
};

const dispatchSlotGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 7,
};

const dispatchSlotBox: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  background: "#f8fafc",
  padding: 8,
};

const dispatchSlotHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 12,
};

const dispatchSlotHeaderRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
};

const dispatchSlotTime: React.CSSProperties = {
  color: "#64748b",
  fontSize: 10,
  fontWeight: 800,
};

const dispatchSlotEmpty: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#94a3b8",
  fontSize: 11,
};

const dispatchSlotSummary: React.CSSProperties = {
  margin: "5px 0",
  color: "#334155",
  fontSize: 11,
  fontWeight: 900,
};

const dispatchSlotList: React.CSSProperties = {
  display: "grid",
  gap: 2,
  marginTop: 4,
};

const dispatchSlotItem: React.CSSProperties = {
  color: "#475569",
  fontSize: 10,
  lineHeight: 1.35,
};


const dispatchDriverInput: React.CSSProperties = {
  width: "25%",
  minWidth: 92,
  boxSizing: "border-box",
  padding: "6px 7px",
  borderRadius: 7,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  fontSize: 11,
  outline: "none",
  marginTop: 7,
};

const dispatchSlotCompleteButton: React.CSSProperties = {
  width: "25%",
  minWidth: 92,
  padding: "6px 7px",
  borderRadius: 7,
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 10,
  marginTop: 5,
};

const dispatchSlotMore: React.CSSProperties = {
  color: "#64748b",
  fontSize: 10,
  fontWeight: 900,
  marginTop: 2,
};

const dispatchSlotActions: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 5,
  marginTop: 7,
};

const dispatchSlotCopyButton: React.CSSProperties = {
  padding: "5px 7px",
  borderRadius: 7,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 10,
};

const dispatchSlotDeleteButton: React.CSSProperties = {
  padding: "5px 7px",
  borderRadius: 7,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 10,
};

const selectedTitleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const priorityInlineCheck: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  color: "#334155",
  fontWeight: 900,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const distanceText: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: "#475569",
};

const copyInfo: React.CSSProperties = {
  margin: "0 0 7px",
  color: "#64748b",
  fontSize: 11,
};

const copyButton: React.CSSProperties = {
  width: "100%",
  background: "#111827",
  color: "white",
  padding: "8px 10px",
  borderRadius: 9,
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const copyBox: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: 10,
  borderRadius: 10,
  whiteSpace: "pre-wrap",
  fontFamily: "inherit",
  lineHeight: 1.5,
  marginTop: 8,
  fontSize: 11,
};

const saveButton: React.CSSProperties = {
  width: "100%",
  padding: 9,
  borderRadius: 9,
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  marginTop: 2,
  fontSize: 12,
};

const subButton: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 9,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 6,
  fontSize: 12,
};

const pendingRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 6px",
  borderBottom: "1px solid #eef2f7",
  fontSize: 12,
};

const pendingCheckItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const pendingCount: React.CSSProperties = {
  fontSize: 11,
  color: "#334155",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const pendingActionBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
};

const pendingDeleteButton: React.CSSProperties = {
  padding: "3px 6px",
  borderRadius: 7,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 10,
};

const customerPickerToggle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 9,
  border: "1px solid #cbd5e1",
  background: "#111827",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
  marginBottom: 8,
};

const customerPickerBox: React.CSSProperties = {
  marginTop: 8,
};

const pickerDepthLabel: React.CSSProperties = {
  margin: "8px 0 5px",
  fontSize: 11,
  fontWeight: 900,
  color: "#475569",
};

const kakaoBox: React.CSSProperties = {
  ...panelLarge,
  marginBottom: 10,
};

const kakaoTextarea: React.CSSProperties = {
  ...input,
  minHeight: 94,
  resize: "vertical",
  lineHeight: 1.45,
};

const kakaoButton: React.CSSProperties = {
  width: "100%",
  background: "#2563eb",
  color: "white",
  padding: "8px 10px",
  borderRadius: 9,
  border: "none",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const kakaoHint: React.CSSProperties = {
  marginTop: 6,
  fontSize: 10,
  color: "#64748b",
  lineHeight: 1.4,
};

const searchResultBox: React.CSSProperties = {
  marginTop: -2,
  marginBottom: 8,
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  overflow: "hidden",
  background: "#ffffff",
};

const searchResultButton: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  padding: "7px 8px",
  border: "none",
  borderBottom: "1px solid #eef2f7",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 11,
  textAlign: "left",
};

const searchAddress: React.CSSProperties = {
  color: "#64748b",
  fontSize: 10,
  lineHeight: 1.35,
};

const searchEmpty: React.CSSProperties = {
  padding: 8,
  color: "#64748b",
  fontSize: 11,
};

const pendingCategoryTabs: React.CSSProperties = {
  display: "flex",
  gap: 6,
  marginBottom: 8,
};

const pendingCategoryButton: React.CSSProperties = {
  flex: 1,
  padding: "7px 8px",
  borderRadius: 9,
  border: "1px solid #111827",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
};

const pendingRightActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginLeft: "auto",
};


const completedDispatchPanel: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  border: "1px solid #dbeafe",
  borderRadius: 14,
  background: "#f8fafc",
};

const completedDispatchGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
};

const completedDispatchBox: React.CSSProperties = {
  minHeight: 86,
  padding: 8,
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "white",
  fontSize: 11,
  textAlign: "left",
};

const completedDispatchHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 6,
  alignItems: "center",
  fontSize: 11,
  color: "#0f172a",
  marginBottom: 6,
};

const completedDispatchEmpty: React.CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 11,
};

const completedDispatchSummary: React.CSSProperties = {
  margin: "0 0 5px 0",
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 900,
};

const completedDispatchList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  maxHeight: 72,
  overflowY: "auto",
};

const completedDispatchItem: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.35,
  wordBreak: "keep-all",
};

const completedDetailDrawer: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "min(520px, 92vw)",
  height: "100vh",
  background: "white",
  zIndex: 1000,
  padding: 18,
  boxShadow: "-20px 0 45px rgba(15, 23, 42, 0.20)",
  overflowY: "auto",
};

const completedDetailList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const dispatchControlRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 86px",
  gap: 6,
  marginTop: 7,
};

const dispatchSelect: React.CSSProperties = {
  width: "100%",
  padding: "6px 7px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  fontSize: 11,
  fontWeight: 800,
  boxSizing: "border-box",
};


const selectedDispatchTopControl: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  width: "50%",
};

const selectedDispatchTopSelect: React.CSSProperties = {
  width: "120px",
  padding: "8px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  background: "#ffffff",
  fontSize: 12,
  fontWeight: 900,
  boxSizing: "border-box",
};

const unloadingSelect: React.CSSProperties = {
  width: "100%",
  padding: "6px 7px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  fontSize: 11,
  fontWeight: 800,
  boxSizing: "border-box",
};

const etaText: React.CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  color: "#0f172a",
  fontWeight: 900,
};

const deleteButton: React.CSSProperties = {
  width: "100%",
  padding: 8,
  borderRadius: 9,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  cursor: "pointer",
  marginTop: 6,
  fontSize: 12,
};
