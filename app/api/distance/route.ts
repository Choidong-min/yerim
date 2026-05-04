import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Coord = {
  x: string | number;
  y: string | number;
};

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value);
}

function haversineKm(origin: Coord, destination: Coord) {
  const lon1 = toNumber(origin.x);
  const lat1 = toNumber(origin.y);
  const lon2 = toNumber(destination.x);
  const lat2 = toNumber(destination.y);

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

async function kakaoDistance(
  key: string,
  origin: Coord,
  destination: Coord
): Promise<{ distanceKm: number; durationMin: number; fallback: boolean }> {
  const originX = toNumber(origin.x);
  const originY = toNumber(origin.y);
  const destinationX = toNumber(destination.x);
  const destinationY = toNumber(destination.y);

  if (
    Number.isNaN(originX) ||
    Number.isNaN(originY) ||
    Number.isNaN(destinationX) ||
    Number.isNaN(destinationY)
  ) {
    throw new Error("좌표값 오류");
  }

  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", `${originX},${originY}`);
  url.searchParams.set("destination", `${destinationX},${destinationY}`);
  url.searchParams.set("priority", "TIME");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${key}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    const summary = data?.routes?.[0]?.summary;

    if (!summary) {
      throw new Error("경로 없음");
    }

    return {
      distanceKm: Math.round((summary.distance / 1000) * 10) / 10,
      durationMin: Math.round(summary.duration / 60),
      fallback: false,
    };
  } catch {
    const straightKm = haversineKm(origin, destination);
    const roadLikeKm = Math.round(straightKm * 1.35 * 10) / 10;

    return {
      distanceKm: roadLikeKm,
      durationMin: Math.max(1, Math.round(roadLikeKm * 1.6)),
      fallback: true,
    };
  }
}

export async function POST(req: NextRequest) {
  const key = process.env.KAKAO_REST_API_KEY;

  try {
    const body = await req.json();
    const origin = body.origin;
    const destination = body.destination;

    const result = await kakaoDistance(key, origin, destination);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "거리 계산 실패" }, { status: 500 });
  }
}
