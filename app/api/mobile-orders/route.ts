import { NextResponse } from "next/server";

type MobileOrder = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
};

let orders: MobileOrder[] = [];

export async function GET() {
  return NextResponse.json({
    orders,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const text = String(body.text ?? "").trim();

    if (!name || !text) {
      return NextResponse.json(
        { error: "이름 또는 발주내용 없음" },
        { status: 400 },
      );
    }

    const order: MobileOrder = {
      id: Date.now().toString(),
      name,
      text,
      createdAt: new Date().toLocaleString("ko-KR"),
    };

    orders.unshift(order);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch {
    return NextResponse.json(
      { error: "발주 저장 실패" },
      { status: 500 },
    );
  }
}