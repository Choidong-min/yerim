import { NextRequest, NextResponse } from "next/server";

type MobileOrder = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
};

const globalStore = globalThis as unknown as {
  mobileOrders?: MobileOrder[];
};

if (!globalStore.mobileOrders) {
  globalStore.mobileOrders = [];
}

const getTimeText = () => {
  const now = new Date();

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(now)
    .replace(/\.\s?/g, ".")
    .replace(/,\s?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export async function GET() {
  return NextResponse.json({
    orders: globalStore.mobileOrders ?? [],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const text = String(body.text ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "이름 없음" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "발주 내용 없음" }, { status: 400 });
  }

  const order: MobileOrder = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    text,
    createdAt: getTimeText(),
  };

  globalStore.mobileOrders = [order, ...(globalStore.mobileOrders ?? [])].slice(
    0,
    100,
  );

  return NextResponse.json({ ok: true, order });
}
