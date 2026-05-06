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
};

const MOBILE_MODE_KEY = "mobile_default_mode_v1";
const RECENT_ORDER_KEY = "mobile_recent_orders_v2";
const ORDER_NAME_KEY = "mobile_order_name_v1";
const DISPATCH_NAME_KEY = "mobile_dispatch_name_v1";
const MOBILE_DISPATCH_KEY = "delivery_mobile_dispatch_v1";

export default function MobilePage() {
  const [mode, setMode] = useState<Mode>("order");
  const [orderText, setOrderText] = useState("");
  const [orderName, setOrderName] = useState("");
  const [dispatchName, setDispatchName] = useState("");
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [dispatchItems, setDispatchItems] = useState<MobileDispatchItem[]>([]);
  const [openedDispatchId, setOpenedDispatchId] = useState<number | null>(null);
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

  const loadDispatchItems = () => {
    try {
      const saved = localStorage.getItem(MOBILE_DISPATCH_KEY);
      if (!saved) {
        setDispatchItems([]);
        return;
      }

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setDispatchItems(
          parsed
            .filter((item: MobileDispatchItem) => item?.id && item?.customer)
            .sort(
              (a: MobileDispatchItem, b: MobileDispatchItem) =>
                (a.order ?? 0) - (b.order ?? 0),
            ),
        );
      }
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

  const confirmDispatch = () => {
    const name = dispatchName.trim();

    if (!name) {
      alert("이름을 입력하세요.");
      return;
    }

    alert(`${name} 배차 확인 완료`);
  };

  const filteredDispatchItems = dispatchName.trim()
    ? dispatchItems.filter((item) => item.assignedTo === dispatchName.trim())
    : dispatchItems;

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
                filteredDispatchItems.map((item) => (
                  <button
                    key={`${item.id}-${item.order}`}
                    onClick={() => {
                      setOpenedDispatchId(item.id);
                      changeMode("dispatch");
                    }}
                    style={styles.dispatchCard}
                  >
                    <div style={styles.dispatchCardTop}>
                      <span>
                        {item.order}. {item.area} {item.customer}
                      </span>
                      <span>{item.count ?? 0}장</span>
                    </div>
                    <div style={styles.dispatchCardBottom}>
                      {item.assignedTo || "배차자 미입력"} /{" "}
                      {item.distanceKm == null
                        ? "거리 미계산"
                        : `${item.distanceKm}km`}{" "}
                      / {formatMin(item.etaMin)}
                    </div>
                  </button>
                ))
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

              {selectedDispatchItem ? (
                <div style={styles.dispatchDetail}>
                  <div style={styles.detailTitle}>
                    {selectedDispatchItem.order}. {selectedDispatchItem.area}{" "}
                    {selectedDispatchItem.customer}
                  </div>
                  <div style={styles.detailLine}>
                    수량: {selectedDispatchItem.count ?? 0}장
                  </div>
                  <div style={styles.detailLine}>
                    배차자: {selectedDispatchItem.assignedTo || "미입력"}
                  </div>
                  <div style={styles.detailLine}>
                    거리:{" "}
                    {selectedDispatchItem.distanceKm == null
                      ? "미계산"
                      : `${selectedDispatchItem.distanceKm}km`}
                  </div>
                  <div style={styles.detailLine}>
                    예상 도착: {formatMin(selectedDispatchItem.etaMin)}
                  </div>
                </div>
              ) : filteredDispatchItems.length > 0 ? (
                <div style={styles.dispatchDetail}>
                  {filteredDispatchItems.map((item) => (
                    <div key={`${item.id}-${item.order}`} style={styles.detailMiniCard}>
                      {item.order}. {item.area} {item.customer}{" "}
                      {item.count ?? 0}장 / {formatMin(item.etaMin)}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyText}>
                  배차목록에서 항목을 선택하거나 이름을 입력하세요.
                </div>
              )}
            </div>

            <button onClick={confirmDispatch} style={styles.actionButton}>
              <span style={styles.actionIcon}>➤</span>
              배차 확인
            </button>
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
