"use client";

import { useEffect, useState } from "react";

type RecentOrder = {
  id: number;
  time: string;
  name: string;
  text: string;
};

type TabType = "order" | "dispatch";

type DispatchItem = {
  id: number;
  area: string;
  customer: string;
  count: number;
  status: "waiting" | "started";
};

const NAME_KEY = "mobile_order_name";
const RECENT_KEY = "mobile_recent_orders";
const TAB_KEY = "mobile_selected_tab";
const LOCK_KEY = "mobile_locked_tab";

const sampleDispatchItems: DispatchItem[] = [
  { id: 1, area: "목포", customer: "포이닉스", count: 5, status: "waiting" },
  { id: 2, area: "목포", customer: "채움퍼니처", count: 7, status: "waiting" },
  { id: 3, area: "나주", customer: "미광퍼니쳐", count: 3, status: "waiting" },
];

export default function MobilePage() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [tab, setTab] = useState<TabType>("order");
  const [lockedTab, setLockedTab] = useState<TabType | null>(null);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>(sampleDispatchItems);

  useEffect(() => {
    const savedName = localStorage.getItem(NAME_KEY);
    const savedRecent = localStorage.getItem(RECENT_KEY);
    const savedTab = localStorage.getItem(TAB_KEY) as TabType | null;
    const savedLockedTab = localStorage.getItem(LOCK_KEY) as TabType | null;

    if (savedName) setName(savedName);

    if (savedRecent) {
      try {
        setRecentOrders(JSON.parse(savedRecent));
      } catch {
        localStorage.removeItem(RECENT_KEY);
      }
    }

    if (savedLockedTab === "order" || savedLockedTab === "dispatch") {
      setLockedTab(savedLockedTab);
      setTab(savedLockedTab);
      return;
    }

    if (savedTab === "order" || savedTab === "dispatch") {
      setTab(savedTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab);
  }, [tab]);

  useEffect(() => {
    if (lockedTab) {
      localStorage.setItem(LOCK_KEY, lockedTab);
      setTab(lockedTab);
    } else {
      localStorage.removeItem(LOCK_KEY);
    }
  }, [lockedTab]);

  const getNowTime = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  };

  const getFirstLine = (value: string) => {
    return value.split(/\r?\n/).find((line) => line.trim())?.trim() ?? "업체명 없음";
  };

  const registerOrder = () => {
    if (!name.trim()) {
      alert("등록자 이름을 입력하세요.");
      return;
    }

    if (!text.trim()) {
      alert("카톡 발주내용을 붙여넣으세요.");
      return;
    }

    const newOrder: RecentOrder = {
      id: Date.now(),
      time: getNowTime(),
      name: name.trim(),
      text: text.trim(),
    };

    const nextRecent = [newOrder, ...recentOrders].slice(0, 5);

    setRecentOrders(nextRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(nextRecent));
    setText("");

    alert("등록 완료");
  };

  const moveTab = (nextTab: TabType) => {
    if (lockedTab && lockedTab !== nextTab) {
      alert("화면 고정 체크를 풀어야 이동할 수 있습니다.");
      return;
    }

    setTab(nextTab);
  };

  const toggleLock = (targetTab: TabType) => {
    if (lockedTab === targetTab) {
      setLockedTab(null);
      return;
    }

    setLockedTab(targetTab);
    setTab(targetTab);
  };

  const startDispatch = (id: number) => {
    setDispatchItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "started" } : item
      )
    );
  };

  return (
    <main style={page}>
      <div style={container}>
        {tab === "order" && (
          <>
            <h2 style={title}>발주 등록</h2>

            <label style={label}>등록자</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 최동민"
              style={input}
            />

            <label style={label}>카톡 발주내용</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`예)
목포 포이닉스
글로시화이트 5장
엣지 2줄`}
              style={textarea}
            />

            <button onClick={registerOrder} style={button}>
              등록하기
            </button>

            <div style={recentBox}>
              <h3 style={subTitle}>최근 등록</h3>

              {recentOrders.length === 0 && (
                <div style={emptyText}>최근 등록 내역이 없습니다.</div>
              )}

              {recentOrders.map((order) => (
                <div key={order.id} style={recentItem}>
                  <strong>{order.time}</strong> {getFirstLine(order.text)} - {order.name}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "dispatch" && (
          <>
            <h2 style={title}>배차</h2>

            {!name.trim() && (
              <div style={emptyText}>발주 탭에서 등록자 이름을 먼저 입력하세요.</div>
            )}

            {name.trim() && (
              <div style={dispatchList}>
                {dispatchItems.map((item, index) => (
                  <div key={item.id} style={dispatchItem}>
                    <div style={dispatchTextBox}>
                      <div style={dispatchName}>
                        {index + 1}. {item.area} {item.customer}
                      </div>
                      <div style={dispatchMeta}>
                        {item.count}장 / {item.status === "started" ? "출발완료" : "대기중"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startDispatch(item.id)}
                      style={{
                        ...startButton,
                        background: item.status === "started" ? "#64748b" : "#111827",
                      }}
                    >
                      출발
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <nav style={bottomNav}>
        <button
          type="button"
          onClick={() => moveTab("order")}
          style={{
            ...tabButton,
            background: tab === "order" ? "#111827" : "#ffffff",
            color: tab === "order" ? "#ffffff" : "#111827",
          }}
        >
          <input
            type="checkbox"
            checked={lockedTab === "order"}
            onChange={() => toggleLock("order")}
            onClick={(e) => e.stopPropagation()}
            style={bigCheckBox}
          />
          발주
        </button>

        <button
          type="button"
          onClick={() => moveTab("dispatch")}
          style={{
            ...tabButton,
            background: tab === "dispatch" ? "#111827" : "#ffffff",
            color: tab === "dispatch" ? "#ffffff" : "#111827",
          }}
        >
          <input
            type="checkbox"
            checked={lockedTab === "dispatch"}
            onChange={() => toggleLock("dispatch")}
            onClick={(e) => e.stopPropagation()}
            style={bigCheckBox}
          />
          배차
        </button>
      </nav>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f1f5f9",
  padding: "12px 12px 80px",
};

const container: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto",
  background: "white",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 12,
};

const subTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  marginBottom: 8,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  marginTop: 10,
  marginBottom: 4,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 150,
  padding: 10,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  resize: "none",
  boxSizing: "border-box",
};

const button: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  padding: 12,
  background: "#111827",
  color: "white",
  borderRadius: 10,
  border: "none",
  fontWeight: 900,
  fontSize: 14,
};

const recentBox: React.CSSProperties = {
  marginTop: 20,
};

const recentItem: React.CSSProperties = {
  fontSize: 12,
  padding: "7px 0",
  borderBottom: "1px solid #e5e7eb",
};

const emptyText: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
};

const dispatchList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const dispatchItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "7px 0",
  borderBottom: "1px solid #e5e7eb",
};

const dispatchTextBox: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const dispatchName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#111827",
  marginBottom: 4,
};

const dispatchMeta: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 800,
};

const startButton: React.CSSProperties = {
  width: 64,
  height: 64,
  minWidth: 64,
  borderRadius: "50%",
  border: "none",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
};

const bottomNav: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  padding: 10,
  background: "#ffffff",
  borderTop: "1px solid #e5e7eb",
  boxShadow: "0 -4px 14px rgba(0,0,0,0.06)",
};

const tabButton: React.CSSProperties = {
  height: 54,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontWeight: 900,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
};

const bigCheckBox: React.CSSProperties = {
  width: 20,
  height: 20,
  minWidth: 20,
  cursor: "pointer",
};
