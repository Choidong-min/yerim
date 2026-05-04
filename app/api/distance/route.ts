import { NextRequest, NextResponse } from "next/server";

type Coord = {
  lat: number;
  lng: number;
};

// 직선거리 → 도로거리 보정
function fallbackDistance(origin: Coord, destination: Coord) {
  const R = 6371;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;

  const roadLikeKm = Math.round(straightKm * 1.35 * 10) / 10;

  return {
    distanceKm: roadLikeKm,
    durationMin: Math.max(1, Math.round(roadLikeKm * 1.6)),
    fallback: true,
  };
}

async function kakaoDistance(
  origin: Coord,
  destination: Coord,
  key: string
) {
  const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${key}`,
    },
  });

  if (!res.ok) {
    throw new Error("카카오 API 실패");
  }

  const data = await res.json();

  const route = data.routes?.[0]?.summary;

  if (!route) {
    throw new Error("경로 없음");
  }

  return {
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMin: Math.round(route.duration / 60),
    fallback: false,
  };
}

export async function POST(req: NextRequest) {
  // 👉 여기에 키 넣어라
  const key = "7356a5f00174055d71b1c398a9eec8d8";

  try {
    const body = await req.json();

    const origin: Coord = body.origin;
    const destination: Coord = body.destination;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "좌표 없음" },
        { status: 400 }
      );
    }

    try {
      const result = await kakaoDistance(origin, destination, key);
      return NextResponse.json(result);
    } catch {
      // 카카오 실패 → fallback
      const fallback = fallbackDistance(origin, destination);
      return NextResponse.json(fallback);
    }
  } catch {
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}