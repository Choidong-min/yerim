import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type KakaoDoc = {
  x?: string;
  y?: string;
  address_name?: string;
  road_address_name?: string;
  place_name?: string;
};

function normalize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/전남/g, "전라남도")
    .trim();
}

async function kakaoSearch(url: string, key: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${key}`,
    },
    cache: "no-store",
  });

  const text = await res.text();

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || "카카오 검색 실패");
  }

  return data;
}

export async function POST(req: NextRequest) {
  // 🔥 여기 수정 (환경변수 → 직접 입력)
  const key = "7356a5f00174055d71b1c398a9eec8d8";

  try {
    const body = await req.json();
    const address = normalize(String(body.address || ""));
    const name = normalize(String(body.name || ""));
    const area = normalize(String(body.area || ""));

    if (!address && !name) {
      return NextResponse.json(
        { error: "주소 또는 업체명 없음" },
        { status: 400 }
      );
    }

    const addressQueries = [address].filter(Boolean);

    for (const query of addressQueries) {
      const url =
        "https://dapi.kakao.com/v2/local/search/address.json?query=" +
        encodeURIComponent(query);

      const data = await kakaoSearch(url, key);
      const doc: KakaoDoc | undefined = data?.documents?.[0];

      if (doc?.x && doc?.y) {
        return NextResponse.json({
          x: doc.x,
          y: doc.y,
          source: "address",
          name,
          address: doc.address_name || address,
          fallback: false,
        });
      }
    }

    const keywordQueries = [
      `${area} ${name}`,
      `${area} ${address}`,
      name,
      address,
    ]
      .map(normalize)
      .filter(Boolean);

    for (const query of keywordQueries) {
      const url =
        "https://dapi.kakao.com/v2/local/search/keyword.json?query=" +
        encodeURIComponent(query);

      const data = await kakaoSearch(url, key);
      const doc: KakaoDoc | undefined = data?.documents?.[0];

      if (doc?.x && doc?.y) {
        return NextResponse.json({
          x: doc.x,
          y: doc.y,
          source: "keyword",
          name: doc.place_name || name,
          address: doc.road_address_name || doc.address_name || address,
          fallback: false,
        });
      }
    }

    return NextResponse.json(
      { error: `주소 변환 실패: ${address || name}` },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "주소 변환 API 호출 실패" },
      { status: 500 }
    );
  }
}