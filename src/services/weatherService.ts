import { CurrentWeather, DailyForecast, HourlyForecast, WeatherBundle } from "../types";

/**
 * Open-Meteo — key gerektirmeyen, ücretsiz (ticari olmayan kullanım için)
 * hava durumu servisi. Namaz vaktindeki geocoding ile aynı sağlayıcı ailesi.
 * Şartlar: https://open-meteo.com/en/terms (10.000 çağrı/gün, 5.000/saat,
 * 600/dakika). Uygulama ölçek büyüdükçe kendi sunucun üzerinden bir
 * cache proxy'ye geçmek gerekebilir — bkz. proje notları.
 */
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const HOURLY_WINDOW = 48;

export class WeatherServiceError extends Error {
  constructor(message: string, public readonly code: "NETWORK" | "API_ERROR") {
    super(message);
  }
}

function toUnix(isoLocal: string): number {
  // Open-Meteo "timezone=auto" ile yerel saat döndürüyor (ör. "2026-08-16T14:00"),
  // bunu UTC gibi parse edip Date.now() ile aynı referansta unix ts'e çeviriyoruz.
  return Math.floor(new Date(isoLocal).getTime() / 1000);
}

export async function fetchWeatherBundle(
  latitude: number,
  longitude: number,
  _lang: string = "tr"
): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      "temperature_2m", "relative_humidity_2m", "apparent_temperature",
      "is_day", "weather_code", "wind_speed_10m", "surface_pressure",
    ].join(","),
    hourly: [
      "temperature_2m", "apparent_temperature", "precipitation_probability",
      "weather_code", "is_day",
    ].join(","),
    daily: [
      "weather_code", "temperature_2m_max", "temperature_2m_min",
      "precipitation_probability_max", "sunrise", "sunset",
    ].join(","),
    timezone: "auto",
    forecast_days: "8",
  });

  let res: Response;
  try {
    res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  } catch {
    throw new WeatherServiceError("Hava durumu servisine ulaşılamadı.", "NETWORK");
  }

  if (!res.ok) {
    throw new WeatherServiceError(
      `Hava durumu servisi hata döndürdü (${res.status}).`,
      "API_ERROR"
    );
  }

  const data = await res.json();

  const sunriseToday = toUnix(data.daily.sunrise[0]);
  const sunsetToday = toUnix(data.daily.sunset[0]);

  const current: CurrentWeather = {
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    pressure: Math.round(data.current.surface_pressure),
    weatherCode: data.current.weather_code,
    isDay: data.current.is_day === 1,
    sunrise: sunriseToday,
    sunset: sunsetToday,
    popToday: data.daily.precipitation_probability_max?.[0] ?? 0,
  };

  const nowTs = Date.now() / 1000;
  const hourlyTimes: string[] = data.hourly.time;
  let startIdx = hourlyTimes.findIndex((iso) => toUnix(iso) >= nowTs);
  if (startIdx === -1) startIdx = 0;

  const hourly: HourlyForecast[] = hourlyTimes
    .slice(startIdx, startIdx + HOURLY_WINDOW)
    .map((iso, i) => {
      const idx = startIdx + i;
      return {
        dt: toUnix(iso),
        temperature: Math.round(data.hourly.temperature_2m[idx]),
        feelsLike: Math.round(data.hourly.apparent_temperature[idx]),
        weatherCode: data.hourly.weather_code[idx],
        pop: (data.hourly.precipitation_probability[idx] ?? 0) / 100,
        isDay: data.hourly.is_day[idx] === 1,
      };
    });

  const dailyTimes: string[] = data.daily.time;
  const daily: DailyForecast[] = dailyTimes.slice(0, 7).map((iso, idx) => ({
    dt: toUnix(iso) + 12 * 3600, // öğlen referansı (görüntüleme için)
    tempMin: Math.round(data.daily.temperature_2m_min[idx]),
    tempMax: Math.round(data.daily.temperature_2m_max[idx]),
    weatherCode: data.daily.weather_code[idx],
    pop: (data.daily.precipitation_probability_max?.[idx] ?? 0) / 100,
  }));

  return { current, hourly, daily, fetchedAt: Date.now() };
}
