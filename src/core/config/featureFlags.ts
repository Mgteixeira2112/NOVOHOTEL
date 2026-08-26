export type FeatureFlag =
  | 'hotelOsCommandCenter'
  | 'hotelOsRealtime'
  | 'hotelOsEvents'
  | 'pdvV2'
  | 'tabletQuarto'
  | 'offlinePwa';

const defaults: Record<FeatureFlag, boolean> = {
  hotelOsCommandCenter: false,
  hotelOsRealtime: false,
  hotelOsEvents: false,
  pdvV2: false,
  tabletQuarto: false,
  offlinePwa: false,
};

function envFlag(name: string, fallback: boolean): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === true || raw === 'true' || raw === '1';
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return envFlag(`VITE_FEATURE_${flag.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`, defaults[flag]);
}

export const featureFlags = Object.freeze(
  Object.fromEntries(Object.keys(defaults).map((flag) => [flag, isFeatureEnabled(flag as FeatureFlag)])) as Record<FeatureFlag, boolean>,
);
