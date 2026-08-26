export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'staging' | 'production';
}

const readEnv = (name: string): string => {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

export const runtimeConfig: RuntimeConfig = {
  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
  environment: (readEnv('VITE_APP_ENV') || 'development') as RuntimeConfig['environment'],
};

export const isProduction = runtimeConfig.environment === 'production';
