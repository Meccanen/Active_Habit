/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMOB_BANNER_ID: string;
  readonly VITE_ADMOB_REWARDED_INTERSTITIAL_ID: string;
  readonly VITE_ADMOB_TEST_DEVICE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}