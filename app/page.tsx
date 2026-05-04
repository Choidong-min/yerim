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
  { id: 1, area: "전남 목포", name: "로얄씽크유통", address: "전라남도 목포시 삼학로 234", grade: "white", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 2, area: "전남 목포", name: "리빙&성민", address: "전라남도 목포시 공단중앙로 40-1", grade: "white", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 3, area: "전남 목포", name: "채움퍼니처", address: "전라남도 목포시 연산로 218", grade: "blue", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 4, area: "전남 목포", name: "SD어울림", address: "전라남도 목포시 연산로 231", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 5, area: "전남 목포", name: "주식회사 힐링캠프", address: "전라남도 목포시 연산로 218", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 6, area: "전남 나주", name: "유한회사 중앙씽크", address: "전라남도 나주시 남평읍 풍림남석길 55-37", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 7, area: "전남 나주", name: "하늘가구산업", address: "전라남도 나주시 남평읍 원암길 49", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 8, area: "전남 목포", name: "예림주방가구", address: "전라남도 목포시 하당로 86", grade: "blue", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 9, area: "전남 무안", name: "토리 주방가구(kitchen)", address: "전라남도 무안군 청계면 도대로 19", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 10, area: "전남 목포", name: "세종주방", address: "전라남도 목포시 해안로249번길 21-1", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 11, area: "전남 진도", name: "제일씽크공장", address: "전라남도 진도군 군내면 정거름재길 218-3", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 12, area: "전남 진도", name: "진모씽크.가구공장", address: "전라남도 진도군 진도읍 교동3길 25", grade: "green", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 13, area: "전남 목포", name: "포이닉스", address: "전라남도 목포시 연산로 61", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 14, area: "전남 목포", name: "핀란디아", address: "전라남도 목포시 용당로 33", grade: "yellow", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 15, area: "전남 무안", name: "명인싱크", address: "전라남도 무안군 일로읍 죽사동길 24", grade: "yellow", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 16, area: "전남 목포", name: "제이원퍼니처", address: "전라남도 목포시 고하대로719번길 22", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 17, area: "전남 목포", name: "(유)공간디자인", address: "전라남도 목포시 공단중앙로 20-1", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 18, area: "전남 나주", name: "우림주방", address: "전라남도 나주시 산포면 산제리 380", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 19, area: "전남 해남", name: "엘림종합싱크", address: "전라남도 해남군 해남읍 내사길 454", grade: "yellow", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 20, area: "전남 목포", name: "에스제이주방가구", address: "전라남도 목포시 공단중앙로 46", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 21, area: "전남 목포", name: "하울퍼니처", address: "전라남도 목포시 고하대로719번길 26", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 22, area: "전남 나주", name: "미목가구", address: "전라남도 나주시 금천면 금영로 729", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 23, area: "전남 목포", name: "원앙씽크", address: "전라남도 목포시 용당로 45", grade: "yellow", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 24, area: "전남 해남", name: "고려씽크", address: "전라남도 해남군 해남읍 남부순환로 321-22", grade: "yellow", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 25, area: "전남 나주", name: "유한회사 정이하우징", address: "전라남도 나주시 남평읍 남평향교길 79-10 2호", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 26, area: "전남 나주", name: "주식회사미길", address: "전라남도 나주시 남평읍 남평향교길 79-8", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 27, area: "전남 목포", name: "가온퍼니쳐", address: "전라남도 목포시 연산동 1236-8", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 28, area: "전남 무안", name: "태광씽크", address: "전라남도 목포시 하당로 86", grade: "amber", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 29, area: "전남 목포", name: "기쁨씽크공장", address: "전라남도 목포시 원산로85번길 19", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 30, area: "전남 영광", name: "영광씽크", address: "전라남도 영광군 영광읍 와룡로33-6", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 31, area: "전남 무안", name: "두손메이드가구", address: "전라남도 무안군 삼향읍 무영로 217-15", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 32, area: "전남 목포", name: "씽크하우스", address: "전라남도 목포시 대양로109번길 80", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 33, area: "전남 나주", name: "주식회사 미광퍼니쳐", address: "전라남도 나주시 산포면 산남로 134-27", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 34, area: "전남 나주", name: "부일가구", address: "전라남도 나주시 남평읍 원암길 94", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
  { id: 35, area: "전남 나주", name: "하나로씽크공장", address: "전라남도 나주시 건재로 281", grade: "red", selected: false, productionDoor: false, urgent: false, forklift: false },
];

export default function Home() {
  const [startAddress, setStartAddress] = useState("전남 장성군 동화면 금강산로 159");
  const [middleCategory, setMiddleCategory] = useState<"목포" | "광주" | "순천">("목포");
  const [selectedArea, setSelectedArea] = useState("전남 목포");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [message, setMessage] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [kakaoText, setKakaoText] = useState("");
  const [orderCounts, setOrderCounts] = useState<Record<number, number>>({});
  const [pendingOrderIds, setPendingOrderIds] = useState<number[]>([]);
  const [pendingOrderTimes, setPendingOrderTimes] = useState<Record<number, string>>({});
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [routeOrderIds, setRouteOrderIds] = useState<number[]>([]);
  const coordCacheRef = useRef<Map<string, Coord>>(new Map());
  const distanceCacheRef = useRef<Map<string, { distanceKm: number; durationMin: number }>>(new Map());

  const [form, setForm] = useState({
    id: 0,
    area: "전남 목포",
    name: "",
    address: "",
    grade: "white" as Grade,
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [pendingCategory, setPendingCategory] = useState<"목포" | "광주" | "순천">("목포");

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
            distanceKm: null,
            durationMin: null,
            coordWarning: false,
            assignedTo: c.assignedTo ?? "",
            startedAt: null,
            unloadingMin: c.unloadingMin ?? DEFAULT_UNLOADING_MIN,
          }))
        );
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const saveData = customers.map((c) => ({
        ...c,
        selected: false,
        productionDoor: false,
        urgent: false,
        forklift: false,
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
    if (customer.area === "광주" || customer.address.includes("광주")) return "광주";
    if (customer.area === "순천" || customer.address.includes("순천")) return "순천";
    return "목포";
  };

  const pendingAllCustomers = pendingOrderIds
    .map((id) => customers.find((c) => c.id === id && !c.selected))
    .filter(Boolean) as Customer[];

  const pendingCustomers = pendingAllCustomers.filter(
    (customer) => getPendingGroup(customer) === pendingCategory
  );

  const hasPendingByCategory = (category: "목포" | "광주" | "순천") => {
    return pendingAllCustomers.some((customer) => getPendingGroup(customer) === category);
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
    value: boolean
  ) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );

    if (field === "selected" && !value) {
      setRouteOrderIds((prev) => prev.filter((routeId) => routeId !== id));
    }
  };

  const resetDispatch = () => {
    setCustomers((prev) =>
      prev.map((c) => ({
        ...c,
        selected: false,
        productionDoor: false,
        urgent: false,
        forklift: false,
        distanceKm: null,
        durationMin: null,
        coordWarning: false,
        startedAt: null,
        unloadingMin: c.unloadingMin ?? DEFAULT_UNLOADING_MIN,
      }))
    );
    setRouteOrderIds([]);
    setKakaoText("");
    setPendingOrderTimes({});
    setMessage("배차 초기화 완료");
  };

  const geocode = async (address: string, name?: string, area?: string): Promise<Coord> => {
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
          requests.push({ address: `${baseAddress} ${cleanName}`, name: cleanName, area });
          if (area) requests.push({ address: `${area} ${cleanName}`, name: cleanName, area });
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
    destination: Coord
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
    destinations: Coord[]
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

  const getGradeRoutePenalty = (customer: Customer, step: number, total: number) => {
    const earlyRatio = total <= 1 ? 0 : 1 - step / (total - 1);

    // white는 화면상 검정/블랙 등급 역할. 초반 선호.
    if (customer.grade === "white") return -22 * earlyRatio;
    if (customer.grade === "blue") return -14 * earlyRatio;
    if (customer.grade === "green") return 0;
    if (customer.grade === "amber") return 10 * earlyRatio;
    if (customer.grade === "yellow") return 26 * earlyRatio;
    if (customer.grade === "red") return 75 * earlyRatio;

    return 0;
  };

  const getFlagRoutePenalty = (customer: Customer, step: number, total: number) => {
    const earlyRatio = total <= 1 ? 0 : 1 - step / (total - 1);

    if (customer.productionDoor && !customer.forklift) return -180 * earlyRatio;
    if (customer.urgent && !customer.forklift) return -120 * earlyRatio;
    if (customer.forklift) return 140 * earlyRatio;

    return 0;
  };

  const optimizeRouteWithRouteCost = async <T extends Customer & { coord: Coord }>(
    startCoord: Coord,
    targets: T[]
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

    const beamWidth = targets.length <= 7 ? 90 : targets.length <= 10 ? 120 : 150;
    const startArea = "출발지";

    let states: RouteState[] = [
      {
        route: [],
        remaining: targets,
        currentCoord: startCoord,
        currentArea: startArea,
        visitedAreas: new Set([startArea]),
        areaExitCount: {},
        cost: 0,
      },
    ];

    for (let step = 0; step < targets.length; step++) {
      const nextStates: RouteState[] = [];

      for (const state of states) {
        for (const candidate of state.remaining) {
          const result = await getDistance(state.currentCoord, candidate.coord);
          const candidateArea = getRouteAreaKey(candidate);
          const changedArea = state.currentArea !== candidateArea;
          const returnedArea =
            changedArea && state.visitedAreas.has(candidateArea) && candidateArea !== startArea;

          const exitedCount = state.areaExitCount[candidateArea] ?? 0;
          const repeatAreaPenalty = returnedArea ? 130 + exitedCount * 60 : 0;
          const areaSwitchPenalty = changedArea && state.route.length > 0 ? 8 : 0;
          const gradePenalty = getGradeRoutePenalty(candidate, step, targets.length);
          const flagPenalty = getFlagRoutePenalty(candidate, step, targets.length);

          const moveCost = result.distanceKm + result.durationMin / 12;
          const nextCost =
            state.cost +
            moveCost +
            repeatAreaPenalty +
            areaSwitchPenalty +
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
            remaining: state.remaining.filter((item) => item.id !== candidate.id),
            currentCoord: candidate.coord,
            currentArea: candidateArea,
            visitedAreas: nextVisitedAreas,
            areaExitCount: nextAreaExitCount,
            cost: nextCost,
          });
        }
      }

      nextStates.sort((a, b) => a.cost - b.cost);
      states = nextStates.slice(0, beamWidth);
    }

    return states[0]?.route ?? targets;
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
        const coord = await geocode(customer.address, customer.name, customer.area);
        withCoords.push({
          ...customer,
          coord,
          distanceKm: null,
          durationMin: null,
          coordWarning: false,
        });
      }

      const orderedRoute = await optimizeRouteWithRouteCost(startCoord, withCoords);

      let currentCoord = startCoord;
      const sectionMap = new Map<number, { distanceKm: number; durationMin: number }>();

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
          assignedTo: customer.assignedTo ?? "",
          startedAt: customer.startedAt ?? null,
          unloadingMin: customer.unloadingMin ?? DEFAULT_UNLOADING_MIN,
          distanceKm: section?.distanceKm ?? null,
          durationMin: section?.durationMin ?? null,
          coordWarning:
            (section?.distanceKm ?? 0) <= 0.2 || (section?.distanceKm ?? 0) >= 180,
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
              assignedTo: customer.assignedTo ?? routed.assignedTo ?? "",
              startedAt: customer.startedAt ?? routed.startedAt ?? null,
              unloadingMin: customer.unloadingMin ?? routed.unloadingMin ?? DEFAULT_UNLOADING_MIN,
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
        })
      );

      setMessage("전체 경로 최적화 완료");
    } catch (err: any) {
      setMessage(err.message || "API 호출 실패");
    }
  };

  const totalDistance = selectedCustomers.reduce((sum, c) => {
    return sum + (c.distanceKm ?? 0);
  }, 0);

  const totalOrderCount = selectedCustomers.reduce((sum, c) => {
    return sum + (orderCounts[c.id] ?? 0);
  }, 0);

  const getEtaMin = (targetIndex: number) => {
    if (targetIndex < 0) return null;

    const startedIndex = selectedCustomers.findIndex((customer) => customer.startedAt);
    const baseIndex = startedIndex >= 0 ? startedIndex + 1 : 0;

    if (targetIndex < baseIndex) return 0;

    let total = 0;

    for (let i = baseIndex; i <= targetIndex; i++) {
      const customer = selectedCustomers[i];
      total += customer.durationMin ?? 0;

      if (i < targetIndex) {
        total += customer.unloadingMin ?? DEFAULT_UNLOADING_MIN;
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
    value: string | number
  ) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, [field]: value } : customer
      )
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
          unloadingMin: customer.unloadingMin ?? DEFAULT_UNLOADING_MIN,
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
          mobileDispatch.map((item) => [item.id, item.startedAt ?? null])
        );

        setCustomers((prev) =>
          prev.map((customer) =>
            startedMap.has(customer.id)
              ? { ...customer, startedAt: startedMap.get(customer.id) ?? null }
              : customer
          )
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
    return `${i + 1}. ${c.area.replace("전남 ", "")} ${c.name}${count > 0 ? ` ${count}장` : ""}`;
  })
  .join("\n")}`;

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
      return sum + matches.reduce((lineSum, match) => lineSum + Number(match[1]), 0);
    }, 0);
  };

  const findCustomerFromKakaoText = (text: string) => {
    const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? text;
    const areaKeywords = ["목포", "광주", "순천", "나주", "해남", "영광", "무안", "진도"];
    const foundArea = areaKeywords.find((area) => firstLine.includes(area));

    const cleanInput = (value: string) => {
      return value
        .replace(/앱|발주|추가|주문|오더/g, "")
        .replace(/\d+\.\d+/g, "")
        .replace(/\d{1,2}월\s*\d{1,2}일/g, "")
        .replace(/\d{1,2}\/\d{1,2}/g, "")
        .trim();
    };

    const removeBusinessWords = (value: string) => {
      return value.replace(
        /퍼니처|퍼니쳐|주방가구|씽크공장|씽크|싱크|가구|공장|산업|유통|디자인|하우징|메이드|하우스|종합|주방|kitchen/g,
        ""
      );
    };

    const firstLineWithoutArea = areaKeywords.reduce(
      (value, area) => value.replaceAll(area, ""),
      cleanInput(firstLine)
    );

    const inputName = normalizeText(firstLineWithoutArea);
    const shortInputName = removeBusinessWords(inputName);

    if (inputName.length < 2 && shortInputName.length < 2) return undefined;

    const candidates = customers.filter((customer) => {
      if (!foundArea) return true;
      return customer.area.includes(foundArea) || customer.address.includes(foundArea);
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
      else if (shortInputName.length >= 2 && shortInputName === shortName) score = 75;
      else if (shortInputName.length >= 2 && shortName.includes(shortInputName)) score = 70;
      else if (shortName.length >= 2 && shortInputName.includes(shortName)) score = 65;

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

    if (!matchedCustomer) {
      setMessage(count > 0 ? `총 ${count}장 인식 / 업체 자동매칭 실패` : "업체 자동매칭 실패");
      return;
    }

    if (count > 0) {
      setOrderCounts((prev) => ({
        ...prev,
        [matchedCustomer.id]: (prev[matchedCustomer.id] ?? 0) + count,
      }));
    }

    if (!matchedCustomer.selected) {
      setPendingOrderIds((prev) =>
        prev.includes(matchedCustomer.id) ? prev : [...prev, matchedCustomer.id]
      );
      setPendingOrderTimes((prev) =>
        prev[matchedCustomer.id] ? prev : { ...prev, [matchedCustomer.id]: getCurrentTimeText() }
      );
    }

    setSelectedArea(matchedCustomer.area);
    setForm((prev) => ({ ...prev, area: matchedCustomer.area }));
    setMessage(
      matchedCustomer.selected
        ? count > 0
          ? `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 추가 ${count}장 반영 완료`
          : `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 추가 확인 완료`
        : count > 0
        ? `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} ${count}장 미배차 등록 완료`
        : `${matchedCustomer.area.replace("전남 ", "")} ${matchedCustomer.name} 업체명만 미배차 등록 완료`
    );
    setKakaoText("");
  };

  const movePendingToDispatch = (id: number) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id ? { ...customer, selected: true } : customer
      )
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
    await navigator.clipboard.writeText(copyText);
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
            : c
        )
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
          distanceKm: null,
          durationMin: null,
          coordWarning: false,
          assignedTo: "",
          startedAt: null,
          unloadingMin: DEFAULT_UNLOADING_MIN,
        },
      ]);
    }

    setForm({ id: 0, area: selectedArea, name: "", address: "", grade: "white" });
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
    setForm({ id: 0, area: selectedArea, name: "", address: "", grade: "white" });
  };

  const recalcManualRoute = async (orderedIds: number[]) => {
    try {
      setMessage("변경된 순서 기준 거리 재계산 중...");

      const orderedCustomers = orderedIds
        .map((id) => customers.find((c) => c.id === id && c.selected))
        .filter(Boolean) as Customer[];

      if (orderedCustomers.length === 0) return;

      let currentCoord = await geocode(startAddress, "출발지", "장성");
      const sectionMap = new Map<number, { distanceKm: number; durationMin: number }>();

      for (const customer of orderedCustomers) {
        const targetCoord = await geocode(customer.address, customer.name, customer.area);
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
            coordWarning: section.distanceKm <= 0.2 || section.distanceKm >= 180,
          };
        })
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
          const target = normalizeText(`${customer.area} ${customer.name} ${customer.address}`);
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
      <section style={startBox}>
        <label style={label}>출발지 주소</label>
        <input
          value={startAddress}
          onChange={(e) => setStartAddress(e.target.value)}
          onBlur={() => setStartAddress((prev) => normalizeAddress(prev))}
          style={input}
        />
      </section>

      <div style={topButtonRow}>
        <button onClick={sortDispatch} style={primaryButton}>
          거리 계산해서 배차 정렬
        </button>

        <button onClick={resetDispatch} style={resetButton}>
          배차 초기화
        </button>
      </div>

      {message && <div style={messageBox}>{message}</div>}

      <div style={layout}>
        <section style={panelLarge}>
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
                    background: active ? (hasPending ? "#dc2626" : "#111827") : "#ffffff",
                    color: active ? "#ffffff" : hasPending ? "#dc2626" : "#111827",
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
                  <span style={{ color: getColor(customer.grade), fontWeight: 900 }}>
                    {registeredTime ? `${registeredTime} ` : ""}{customer.area.replace("전남 ", "")} {customer.name}
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
        </section>

        <section style={panelMiddle}>
          <h3 style={sectionTitle}>선택 리스트</h3>
          <p style={hint}>드래그해서 순서 변경</p>

          {selectedCustomers.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 12 }}>선택된 거래처가 없습니다.</p>
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
              <strong>
                {index + 1}. {customer.area} {customer.name}
              </strong>
              <div
                style={{
                  ...distanceText,
                  color: customer.coordWarning ? "#dc2626" : "#475569",
                  fontWeight: customer.coordWarning ? 900 : 400,
                }}
              >
                거리 {customer.distanceKm == null ? "미계산" : `${customer.distanceKm}km`}
                {customer.durationMin == null ? "" : ` / 구간 ${customer.durationMin}분`}
                {customer.coordWarning ? " / 거리확인필요" : ""}
              </div>

              <div style={dispatchControlRow}>
                <select
                  value={customer.assignedTo ?? ""}
                  onChange={(e) =>
                    updateSelectedCustomerField(customer.id, "assignedTo", e.target.value)
                  }
                  style={dispatchSelect}
                >
                  <option value="">담당자 선택</option>
                  {ASSIGNEES.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>

                <select
                  value={customer.unloadingMin ?? DEFAULT_UNLOADING_MIN}
                  onChange={(e) =>
                    updateSelectedCustomerField(customer.id, "unloadingMin", Number(e.target.value))
                  }
                  style={unloadingSelect}
                >
                  <option value={10}>하차 10분</option>
                  <option value={15}>하차 15분</option>
                  <option value={20}>하차 20분</option>
                  <option value={30}>하차 30분</option>
                </select>
              </div>

              <div style={etaText}>
                상태: {customer.startedAt ? `${customer.startedAt} 출발` : "대기중"} / 예상도착: {formatMin(getEtaMin(index))}
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
              placeholder={"예) 목포 채움\n리치펄화이트 3장\n글로시라이트그레이 4장, 엣지 1줄"}
              style={kakaoTextarea}
            />
            <button onClick={applyKakaoText} style={kakaoButton}>
              카톡 내용 자동등록
            </button>
            <div style={kakaoHint}>
              숫자+장만 합산 / 장이 없어도 업체명만 등록 / 줄, 2.7t, 양면우라, 합판우라, 피스마개, 스티커, mdf, 우라는 무시
            </div>
          </div>

          <div style={copyPanel}>
            <h3 style={sectionTitle}>카톡 복사용</h3>
            <p style={copyInfo}>
              총 거리: {Math.round(totalDistance * 10) / 10}km / 총수량: {totalOrderCount}장
            </p>

            <button onClick={copyToClipboard} style={copyButton}>
              복사하기
            </button>

            <pre style={copyBox}>{copyText}</pre>
          </div>

          <div style={panelRight}>
            <h3 style={sectionTitle}>수정 / 등록</h3>

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
                    <span style={{ color: getColor(customer.grade), fontWeight: 900 }}>
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
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              onBlur={() => setForm((prev) => ({ ...prev, address: normalizeAddress(prev.address) }))}
              placeholder="주소"
              style={input}
            />

            <label style={label}>등급 색상</label>
            <select
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value as Grade })}
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
              <button onClick={() => deleteCustomer(form.id)} style={deleteButton}>
                현재 업체 삭제
              </button>
            )}
          </div>
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
  fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Segoe UI, sans-serif",
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
