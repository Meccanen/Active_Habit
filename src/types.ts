export interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  admin1?: string; // bölge/il
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  weatherCode: number; // WMO kodu
  isDay: boolean;
  sunrise: number; // unix ts
  sunset: number;  // unix ts
  popToday: number; // bugünkü maksimum yağış olasılığı (0-100)
}

export interface HourlyForecast {
  dt: number; // unix ts
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  pop: number; // yağış olasılığı (0-1)
  isDay: boolean;
}

export interface DailyForecast {
  dt: number; // unix ts (öğlen referans saati)
  tempMin: number;
  tempMax: number;
  weatherCode: number;
  pop: number; // yağış olasılığı (0-1)
}

export interface WeatherBundle {
  current: CurrentWeather;
  hourly: HourlyForecast[]; // önümüzdeki 48 saat
  daily: DailyForecast[];   // önümüzdeki 7 gün
  fetchedAt: number;
}
