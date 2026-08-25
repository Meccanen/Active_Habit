/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY: string;
  readonly VITE_ADMOB_BANNER_ID: string;
  readonly VITE_ADMOB_TEST_DEVICE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
