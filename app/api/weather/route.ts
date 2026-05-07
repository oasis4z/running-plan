import { NextResponse } from "next/server";

// Wachirabenchatat Park (สวนวชิรเบญจทัศ), Chatuchak, Bangkok
const LAT = 13.8170;
const LON = 100.5553;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface Air4ThaiStation {
  stationID: string;
  nameTH: string;
  areaTH: string;
  lat: string;
  long: string;
  AQILast?: {
    date: string;
    time: string;
    PM25?: { value: string };
  };
}

interface NearestPM25 {
  pm25: number;
  station: string;
  area: string;
  distKm: number;
  updatedAt: string;
}

async function fetchAir4ThaiPM25(): Promise<NearestPM25 | null> {
  try {
    const res = await fetch("http://air4thai.com/forweb/getAQI_JSON.php", {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data: { stations: Air4ThaiStation[] } = await res.json();

    let nearest: NearestPM25 | null = null;
    let minDist = Infinity;

    for (const s of data.stations) {
      const lat = parseFloat(s.lat);
      const lon = parseFloat(s.long);
      if (isNaN(lat) || isNaN(lon)) continue;
      const pm = parseFloat(s.AQILast?.PM25?.value ?? "");
      if (isNaN(pm) || pm < 0) continue; // skip invalid / offline
      const d = haversineKm(LAT, LON, lat, lon);
      if (d < minDist) {
        minDist = d;
        nearest = {
          pm25: pm,
          station: s.nameTH,
          area: s.areaTH,
          distKm: d,
          updatedAt: `${s.AQILast?.date ?? ""} ${s.AQILast?.time ?? ""}`.trim(),
        };
      }
    }
    return nearest;
  } catch {
    return null;
  }
}

export async function GET() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing OPENWEATHER_API_KEY" }, { status: 500 });
  }

  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${key}&units=metric`;

    const [wRes, pm25] = await Promise.all([
      fetch(weatherUrl, { next: { revalidate: 600 } }),
      fetchAir4ThaiPM25(),
    ]);

    if (!wRes.ok) {
      return NextResponse.json({ error: "Weather API error" }, { status: 502 });
    }

    const w = await wRes.json();

    return NextResponse.json({
      temp: Math.round(w.main.temp),
      feelsLike: Math.round(w.main.feels_like),
      description: w.weather?.[0]?.description ?? "",
      icon: w.weather?.[0]?.icon ?? "",
      humidity: w.main.humidity,
      pm25: pm25?.pm25 ?? null,
      pm25Source: pm25
        ? {
            station: pm25.station,
            area: pm25.area,
            distKm: Math.round(pm25.distKm * 10) / 10,
            updatedAt: pm25.updatedAt,
          }
        : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
