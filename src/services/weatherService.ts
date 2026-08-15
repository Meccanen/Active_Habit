import { CurrentWeather, DailyForecast, HourlyForecast, WeatherBundle } from "../types";

/**
 * OpenWeather API anahtarı build zamanında GitHub Actions secret'ından
 * .env dosyasına yazılır (VITE_OPENWEATHER_API_KEY). Yerelde geliştirirken
 * proje kökünde bir .env dosyası oluşturup aynı değişkeni tanımlaman yeterli
 * — bu dosya .gitignore'da olmalı, asla repoya commit edilmemeli.
 */
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

const ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall";

/** Saatlik veriden kaç saatlik pencere gösterileceği (OpenWeather 48 saate kadar veriyor). */
const HOURLY_WINDOW = 48;

export class WeatherServiceError extends Error {
  constructor(message: string, public readonly code: "NO_API_KEY" | "NETWORK" | "API_ERROR") {
    super(message);
  }
}

function isDaytime(dt: number, sunrise: number, sunset: number): boolean {
  return dt >= sunrise && dt < sunset;
}

export async function fetchWeatherBundle(
  latitude: number,
  longitude: number,
  lang: string = "tr"
): Promise<WeatherBundle> {
  if (!API_KEY) {
    throw new WeatherServiceError(
      "OpenWeather API anahtarı tanımlı değil (VITE_OPENWEATHER_API_KEY).",
      "NO_API_KEY"
    );
  }

  // OpenWeather bazı dillerimizi (ur) doğrudan desteklemiyor olabilir, en yakın karşılığa düş.
  const owLang = lang === "ur" ? "en" : lang;

  const url =
    `${ONE_CALL_URL}?lat=${latitude}&lon=${longitude}` +
    `&exclude=minutely,alerts` +
    `&units=metric&lang=${owLang}&appid=${API_KEY}`;

  let res: Response;
  try {
    res = await fetch(url);
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

  const sunrise: number = data.current.sunrise;
  const sunset: number = data.current.sunset;

  const current: CurrentWeather = {
    temperature: Math.round(data.current.temp),
    apparentTemperature: Math.round(data.current.feels_like),
    humidity: data.current.humidity,
    windSpeed: data.current.wind_speed,
    windDeg: data.current.wind_deg,
    pressure: data.current.pressure,
    uvIndex: data.current.uvi,
    visibility: data.current.visibility,
    weatherId: data.current.weather?.[0]?.id ?? 800,
    weatherMain: data.current.weather?.[0]?.main ?? "",
    weatherDesc: data.current.weather?.[0]?.description ?? "",
    isDay: isDaytime(data.current.dt, sunrise, sunset),
    sunrise,
    sunset,
  };

  const hourly: HourlyForecast[] = (data.hourly ?? [])
    .slice(0, HOURLY_WINDOW)
    .map((h: any) => ({
      dt: h.dt,
      temperature: Math.round(h.temp),
      feelsLike: Math.round(h.feels_like),
      weatherId: h.weather?.[0]?.id ?? 800,
      weatherDesc: h.weather?.[0]?.description ?? "",
      pop: h.pop ?? 0,
      // Saatlik kayıtlarda kendi gün doğumu/batımı yok — o günün current sunrise/sunset'iyle
      // yaklaşık hesaplanıyor (48 saatlik pencerede en fazla 1 gün sınırı geçilir, kabul edilebilir sapma).
      isDay: isDaytime(h.dt, sunrise, sunset),
    }));

  const daily: DailyForecast[] = (data.daily ?? [])
    .slice(0, 7)
    .map((d: any) => ({
      dt: d.dt,
      tempMin: Math.round(d.temp.min),
      tempMax: Math.round(d.temp.max),
      weatherId: d.weather?.[0]?.id ?? 800,
      weatherDesc: d.weather?.[0]?.description ?? "",
      pop: d.pop ?? 0,
      humidity: d.humidity,
      windSpeed: d.wind_speed,
    }));

  return { current, hourly, daily, fetchedAt: Date.now() };
}
