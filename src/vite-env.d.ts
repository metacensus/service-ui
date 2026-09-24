/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVIEWER_TOPIC_ID?: string;
  readonly VITE_REVIEWER_RUN_ID?: string;
  readonly VITE_REVIEWER_SNAPSHOT_BASE_URL?: string;
  readonly VITE_REVIEWER_NORMALIZATION_BASE_URL?: string;
  readonly VITE_REVIEWER_INDEX_BASE_URL?: string;
}
