import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  HotelConfig,
  Quarto,
  TipoQuarto,
  Hospede,
  Reserva,
  Pagamento,
  BloqueioQuarto,
  AutomacaoMensagem,
  Usuario,
  SecurityLogEntry,
  MediaUploadRecord,
  MediaCategory,
} from '../types';

// ============================================================================
// SCRIPT SQL DDL OFICIAL E COMPLETO PARA O SUPABASE
// ============================================================================
export const SUPABASE_SQL_SCRIPT = `-- ============================================================================
-- SCRIPT DE CRIAÇÃO E MIGRAÇÃO DO BANCO DE DADOS SUPABASE (HOTEL PMS)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- 1. Tabela de Configurações do Hotel & White-Label
CREATE TABLE IF NOT EXISTS public.hotel_config (
    id TEXT PRIMARY KEY DEFAULT 'default_hotel',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Tipos / Categorias de Quarto
CREATE TABLE IF NOT EXISTS public.tipos_quarto (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    capacidade_padrao INTEGER DEFAULT 2,
    icone TEXT DEFAULT 'BedDouble',
    comodidades_principais TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Acomodações & Quartos
CREATE TABLE IF NOT EXISTS public.quartos (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo_quarto_id TEXT,
    capacidade INTEGER DEFAULT 2,
    valor_diaria NUMERIC(10,2) NOT NULL DEFAULT 0,
    descricao TEXT,
    status TEXT DEFAULT 'disponivel',
    ativo BOOLEAN DEFAULT true,
    andar INTEGER DEFAULT 1,
    fotos TEXT[] DEFAULT '{}',
    comodidades TEXT[] DEFAULT '{}',
    tamanho_m2 INTEGER DEFAULT 30,
    vista TEXT,
    cama TEXT,
    fechadura_pin TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Hóspedes & Clientes CRM
CREATE TABLE IF NOT EXISTS public.hospedes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    documento TEXT,
    data_nascimento TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    nacionalidade TEXT DEFAULT 'Brasileira',
    notas_preferencias TEXT,
    vip BOOLEAN DEFAULT false,
    total_estadias INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Reservas
CREATE TABLE IF NOT EXISTS public.reservas (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    hospede_id TEXT,
    quarto_id TEXT,
    checkin TEXT NOT NULL,
    checkout TEXT NOT NULL,
    quantidade_hospedes INTEGER DEFAULT 1,
    adultos INTEGER DEFAULT 1,
    criancas INTEGER DEFAULT 0,
    valor_diarias NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_taxas NUMERIC(10,2) DEFAULT 0,
    valor_consumo NUMERIC(10,2) DEFAULT 0,
    valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'confirmada',
    forma_pagamento TEXT,
    pagamento_id TEXT,
    observacoes TEXT,
    checkin_horario TEXT,
    checkout_horario TEXT,
    consumo_itens JSONB DEFAULT '[]',
    pin_fechadura TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Pagamentos & Transações Financeiras
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id TEXT PRIMARY KEY,
    reserva_id TEXT,
    valor NUMERIC(10,2) NOT NULL DEFAULT 0,
    metodo TEXT NOT NULL DEFAULT 'pix',
    status TEXT DEFAULT 'aprovado',
    codigo_transacao TEXT,
    parcelas INTEGER DEFAULT 1,
    data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Bloqueios de Quarto e Manutenções
CREATE TABLE IF NOT EXISTS public.bloqueios (
    id TEXT PRIMARY KEY,
    quarto_id TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL,
    motivo TEXT NOT NULL,
    criado_por TEXT DEFAULT 'Sistema',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Automações de Mensagens
CREATE TABLE IF NOT EXISTS public.automacoes (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    gatilho TEXT NOT NULL,
    canal TEXT NOT NULL,
    template TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    variaveis_disponiveis TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de Usuários do Painel Admin & Operadores
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT DEFAULT 'hotel123',
    tipo_usuario TEXT DEFAULT 'recepcionista',
    cargo_titulo TEXT,
    telefone TEXT,
    ativo BOOLEAN DEFAULT true,
    avatar TEXT,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    permissoes TEXT[] DEFAULT '{"todas"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Logs de Auditoria e Segurança
CREATE TABLE IF NOT EXISTS public.logs_seguranca (
    id TEXT PRIMARY KEY,
    usuario_id TEXT,
    usuario_nome TEXT DEFAULT 'Sistema',
    usuario_email TEXT,
    usuario_cargo TEXT,
    operacao TEXT NOT NULL,
    detalhes TEXT,
    categoria TEXT DEFAULT 'Geral',
    metodo_2fa TEXT,
    ip_origem TEXT,
    sucesso BOOLEAN DEFAULT true,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tabela de Uploads de Mídia & Galeria de Fotos (media_uploads)
CREATE TABLE IF NOT EXISTS public.media_uploads (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT,
    category TEXT NOT NULL CHECK (category IN ('hero', 'logo', 'sobre', 'quarto', 'avatar', 'depoimento', 'comodidade', 'outro')),
    room_id TEXT,
    is_cover BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    aspect_ratio TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT DEFAULT 'image/jpeg',
    crop_data JSONB,
    uploaded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_category ON public.media_uploads(category);
CREATE INDEX IF NOT EXISTS idx_media_room_id ON public.media_uploads(room_id);
CREATE INDEX IF NOT EXISTS idx_media_sort_order ON public.media_uploads(sort_order);

-- MIGRAÇÃO / GARANTIA DE COLUNAS (Para bancos já existentes)
ALTER TABLE IF EXISTS public.quartos ADD COLUMN IF NOT EXISTS tipo_quarto_id TEXT;
ALTER TABLE IF EXISTS public.quartos ADD COLUMN IF NOT EXISTS valor_diaria NUMERIC(10,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.quartos ADD COLUMN IF NOT EXISTS cama TEXT;
ALTER TABLE IF EXISTS public.quartos ADD COLUMN IF NOT EXISTS fechadura_pin TEXT;
ALTER TABLE IF EXISTS public.reservas ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE IF EXISTS public.reservas ADD COLUMN IF NOT EXISTS checkin_horario TEXT;
ALTER TABLE IF EXISTS public.reservas ADD COLUMN IF NOT EXISTS checkout_horario TEXT;
ALTER TABLE IF EXISTS public.reservas ADD COLUMN IF NOT EXISTS pin_fechadura TEXT;
ALTER TABLE IF EXISTS public.reservas ADD COLUMN IF NOT EXISTS consumo_itens JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS public.pagamentos ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS public.automacoes ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE IF EXISTS public.automacoes ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE IF EXISTS public.automacoes ADD COLUMN IF NOT EXISTS variaveis_disponiveis TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS senha TEXT DEFAULT 'hotel123';
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS cargo_titulo TEXT;
ALTER TABLE IF EXISTS public.logs_seguranca ADD COLUMN IF NOT EXISTS usuario_email TEXT;
ALTER TABLE IF EXISTS public.logs_seguranca ADD COLUMN IF NOT EXISTS operacao TEXT;
ALTER TABLE IF EXISTS public.logs_seguranca ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Geral';
ALTER TABLE IF EXISTS public.logs_seguranca ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS public.media_uploads ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE IF EXISTS public.media_uploads ADD COLUMN IF NOT EXISTS crop_data JSONB;

-- HABILITAÇÃO DO ROW LEVEL SECURITY (RLS) E POLÍTICAS PÚBLICAS
ALTER TABLE public.hotel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_quarto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quartos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_seguranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PERMISSIVAS PARA OPERAÇÃO DO PMS
DROP POLICY IF EXISTS "Acesso Total Anon hotel_config" ON public.hotel_config;
CREATE POLICY "Acesso Total Anon hotel_config" ON public.hotel_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon tipos_quarto" ON public.tipos_quarto;
CREATE POLICY "Acesso Total Anon tipos_quarto" ON public.tipos_quarto FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon quartos" ON public.quartos;
CREATE POLICY "Acesso Total Anon quartos" ON public.quartos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon hospedes" ON public.hospedes;
CREATE POLICY "Acesso Total Anon hospedes" ON public.hospedes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon reservas" ON public.reservas;
CREATE POLICY "Acesso Total Anon reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon pagamentos" ON public.pagamentos;
CREATE POLICY "Acesso Total Anon pagamentos" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon bloqueios" ON public.bloqueios;
CREATE POLICY "Acesso Total Anon bloqueios" ON public.bloqueios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon automacoes" ON public.automacoes;
CREATE POLICY "Acesso Total Anon automacoes" ON public.automacoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon usuarios" ON public.usuarios;
CREATE POLICY "Acesso Total Anon usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon logs_seguranca" ON public.logs_seguranca;
CREATE POLICY "Acesso Total Anon logs_seguranca" ON public.logs_seguranca FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anon media_uploads" ON public.media_uploads;
CREATE POLICY "Acesso Total Anon media_uploads" ON public.media_uploads FOR ALL USING (true) WITH CHECK (true);

-- CRIAÇÃO DO BUCKET DE ARMAZENAMENTO NO STORAGE SUPABASE (hotel-media)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'hotel-media',
            'hotel-media',
            true,
            10485760,
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
`;
const DEFAULT_URL = 'https://awyxubhwtdgwnssvajnr.supabase.co';
const DEFAULT_KEY = 'sb_publishable_rsP8t4buqj2R7OnMCf0q6g_tuq0nWOh';

export function getStoredSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hotel_supabase_url');
    if (saved && saved.trim()) return saved.trim();
  }
  const raw = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
  return raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '').trim();
}

export function getStoredSupabaseKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('hotel_supabase_key');
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY).trim();
}

export let SUPABASE_URL = getStoredSupabaseUrl();
export const SUPABASE_ANON_KEY = getStoredSupabaseKey();
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Criação da instância singleton do cliente
function initClient(url: string, key: string): SupabaseClient {
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '').trim();
  return createClient(cleanUrl, key.trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export let supabase: SupabaseClient = initClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function updateSupabaseCredentials(newUrl: string, newKey: string): { success: boolean; message: string } {
  try {
    const cleanUrl = newUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '').trim();
    const cleanKey = newKey.trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return { success: false, message: 'A URL deve começar com https:// ou http://' };
    }

    if (!cleanKey) {
      return { success: false, message: 'A chave anon/service não pode ser vazia.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('hotel_supabase_url', cleanUrl);
      localStorage.setItem('hotel_supabase_key', cleanKey);
    }

    SUPABASE_URL = cleanUrl;
    supabase = initClient(cleanUrl, cleanKey);
    return { success: true, message: 'Credenciais atualizadas com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro ao atualizar: ${err?.message || err}` };
  }
}

export function resetSupabaseCredentialsToDefault(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hotel_supabase_url');
    localStorage.removeItem('hotel_supabase_key');
  }
  SUPABASE_URL = DEFAULT_URL;
  supabase = initClient(DEFAULT_URL, DEFAULT_KEY);
}

// ============================================================================
// DIAGNÓSTICO E TESTE DE CONEXÃO & TABELAS
// ============================================================================
export interface TableHealthStatus {
  name: string;
  exists: boolean;
  accessible: boolean;
  rowCount?: number;
  errorMessage?: string;
}

export interface SupabaseHealthReport {
  connected: boolean;
  latencyMs: number;
  message: string;
  allTablesReady: boolean;
  tables: Record<string, TableHealthStatus>;
  missingTables: string[];
}

const REQUIRED_TABLES = [
  'hotel_config',
  'tipos_quarto',
  'quartos',
  'hospedes',
  'reservas',
  'pagamentos',
  'bloqueios',
  'automacoes',
  'usuarios',
  'logs_seguranca',
  'media_uploads',
];

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
  needsTables?: boolean;
}> {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase.from('hotel_config').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (error) {
      if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
        return {
          connected: true,
          latencyMs,
          needsTables: true,
          message: 'Supabase conectado, porém as tabelas precisam ser criadas no SQL Editor.',
        };
      }
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied') || error.message?.toLowerCase().includes('violates row-level security')) {
        return {
          connected: true,
          latencyMs,
          needsTables: false,
          message: 'Supabase conectado, mas requer permissão de RLS para a chave informada.',
        };
      }
      return {
        connected: false,
        latencyMs,
        message: `Falha na resposta do Supabase: ${error.message} (Código: ${error.code})`,
      };
    }

    return {
      connected: true,
      latencyMs,
      message: `Conectado com sucesso ao Supabase (${latencyMs}ms de latência)!`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Erro ao conectar com ${SUPABASE_URL}: ${err?.message || 'Sem conexão com a internet'}`,
    };
  }
}

export async function checkAllTablesHealth(): Promise<SupabaseHealthReport> {
  const startTime = Date.now();
  const tables: Record<string, TableHealthStatus> = {};
  const missingTables: string[] = [];

  let anySuccess = false;

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { data, count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
          tables[tableName] = {
            name: tableName,
            exists: false,
            accessible: false,
            errorMessage: 'Tabela não encontrada no banco (42P01).',
          };
          missingTables.push(tableName);
        } else {
          tables[tableName] = {
            name: tableName,
            exists: true,
            accessible: false,
            errorMessage: error.message,
          };
        }
      } else {
        anySuccess = true;
        tables[tableName] = {
          name: tableName,
          exists: true,
          accessible: true,
          rowCount: count ?? 0,
        };
      }
    } catch (err: any) {
      tables[tableName] = {
        name: tableName,
        exists: false,
        accessible: false,
        errorMessage: err?.message || 'Erro desconhecido',
      };
      missingTables.push(tableName);
    }
  }

  const latencyMs = Date.now() - startTime;
  const allTablesReady = missingTables.length === 0;

  return {
    connected: anySuccess || missingTables.length > 0,
    latencyMs,
    allTablesReady,
    tables,
    missingTables,
    message: allTablesReady
      ? `Todas as 10 tabelas estão prontas e acessíveis (${latencyMs}ms).`
      : `${missingTables.length} tabela(s) pendente(s) de criação: ${missingTables.join(', ')}.`,
  };
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - CONFIGURAÇÃO DO HOTEL
// ============================================================================
export async function fetchHotelConfigFromSupabase(): Promise<HotelConfig | null> {
  try {
    const { data, error } = await supabase
      .from('hotel_config')
      .select('config')
      .eq('id', 'default_hotel')
      .maybeSingle();

    if (error || !data) return null;
    return data.config as HotelConfig;
  } catch {
    return null;
  }
}

export async function saveHotelConfigToSupabase(config: HotelConfig): Promise<boolean> {
  try {
    const { error } = await supabase.from('hotel_config').upsert({
      id: 'default_hotel',
      config,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - QUARTOS E CATEGORIAS
// ============================================================================
export async function fetchRoomTypesFromSupabase(): Promise<TipoQuarto[] | null> {
  try {
    const { data, error } = await supabase.from('tipos_quarto').select('*');
    if (error || !data) return null;
    return data as TipoQuarto[];
  } catch {
    return null;
  }
}

export async function upsertRoomTypeToSupabase(tipo: TipoQuarto): Promise<boolean> {
  try {
    const { error } = await supabase.from('tipos_quarto').upsert({
      id: tipo.id,
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      capacidade_padrao: Number(tipo.capacidade_padrao) || 2,
      icone: tipo.icone || 'BedDouble',
      comodidades_principais: Array.isArray(tipo.comodidades_principais) ? tipo.comodidades_principais : [],
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchRoomsFromSupabase(): Promise<Quarto[] | null> {
  try {
    const { data, error } = await supabase.from('quartos').select('*');
    if (error || !data) return null;
    return data as Quarto[];
  } catch {
    return null;
  }
}

export async function upsertRoomToSupabase(quarto: Quarto): Promise<boolean> {
  try {
    const { error } = await supabase.from('quartos').upsert({
      id: quarto.id,
      numero: String(quarto.numero),
      nome: quarto.nome,
      tipo_quarto_id: quarto.tipo_quarto_id || null,
      capacidade: Number(quarto.capacidade) || 2,
      valor_diaria: Number(quarto.valor_diaria) || 0,
      descricao: quarto.descricao || '',
      status: quarto.status || 'disponivel',
      ativo: quarto.ativo !== false,
      andar: Number(quarto.andar) || 1,
      fotos: Array.isArray(quarto.fotos) ? quarto.fotos : [],
      comodidades: Array.isArray(quarto.comodidades) ? quarto.comodidades : [],
      tamanho_m2: Number(quarto.tamanho_m2) || 30,
      vista: quarto.vista || '',
      cama: quarto.cama || '',
      fechadura_pin: quarto.fechadura_pin || null,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteRoomFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('quartos').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - HÓSPEDES (CRM)
// ============================================================================
export async function fetchGuestsFromSupabase(): Promise<Hospede[] | null> {
  try {
    const { data, error } = await supabase.from('hospedes').select('*');
    if (error || !data) return null;
    return data as Hospede[];
  } catch {
    return null;
  }
}

export async function upsertGuestToSupabase(guest: Hospede): Promise<boolean> {
  try {
    const { error } = await supabase.from('hospedes').upsert({
      id: guest.id,
      nome: guest.nome,
      email: guest.email,
      telefone: guest.telefone,
      documento: guest.documento,
      data_nascimento: guest.data_nascimento || null,
      endereco: guest.endereco || null,
      cidade: guest.cidade || null,
      estado: guest.estado || null,
      nacionalidade: guest.nacionalidade || 'Brasileira',
      notas_preferencias: guest.notas_preferencias || null,
      vip: Boolean(guest.vip),
      total_estadias: Number(guest.total_estadias) || 1,
      created_at: guest.created_at || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteGuestFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('hospedes').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - RESERVAS
// ============================================================================
export async function fetchReservationsFromSupabase(): Promise<Reserva[] | null> {
  try {
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return null;
    return data as Reserva[];
  } catch {
    return null;
  }
}

export async function upsertReservationToSupabase(reserva: Reserva): Promise<boolean> {
  try {
    const { error } = await supabase.from('reservas').upsert({
      id: reserva.id,
      codigo: reserva.codigo,
      hospede_id: reserva.hospede_id,
      quarto_id: reserva.quarto_id,
      checkin: reserva.checkin,
      checkout: reserva.checkout,
      quantidade_hospedes: Number(reserva.quantidade_hospedes) || 1,
      adultos: Number(reserva.adultos) || 1,
      criancas: Number(reserva.criancas) || 0,
      valor_diarias: Number(reserva.valor_diarias) || 0,
      valor_taxas: Number(reserva.valor_taxas) || 0,
      valor_consumo: Number(reserva.valor_consumo) || 0,
      valor_total: Number(reserva.valor_total) || 0,
      status: reserva.status || 'confirmada',
      forma_pagamento: reserva.forma_pagamento || null,
      pagamento_id: reserva.pagamento_id || null,
      observacoes: reserva.observacoes || '',
      checkin_horario: reserva.checkin_horario || null,
      checkout_horario: reserva.checkout_horario || null,
      consumo_itens: Array.isArray(reserva.consumo_itens) ? reserva.consumo_itens : [],
      pin_fechadura: reserva.pin_fechadura || null,
      created_at: reserva.created_at || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteReservationFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('reservas').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - PAGAMENTOS
// ============================================================================
export async function fetchPaymentsFromSupabase(): Promise<Pagamento[] | null> {
  try {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .order('data_pagamento', { ascending: false });
    if (error || !data) return null;
    return data as Pagamento[];
  } catch {
    return null;
  }
}

export async function upsertPaymentToSupabase(pagamento: Pagamento): Promise<boolean> {
  try {
    const { error } = await supabase.from('pagamentos').upsert({
      id: pagamento.id,
      reserva_id: pagamento.reserva_id,
      valor: Number(pagamento.valor) || 0,
      metodo: pagamento.metodo,
      status: pagamento.status || 'aprovado',
      codigo_transacao: pagamento.codigo_transacao || '',
      parcelas: Number(pagamento.parcelas) || 1,
      data_pagamento: pagamento.data_pagamento || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - BLOQUEIOS
// ============================================================================
export async function fetchBlocksFromSupabase(): Promise<BloqueioQuarto[] | null> {
  try {
    const { data, error } = await supabase.from('bloqueios').select('*');
    if (error || !data) return null;
    return data as BloqueioQuarto[];
  } catch {
    return null;
  }
}

export async function upsertBlockToSupabase(block: BloqueioQuarto): Promise<boolean> {
  try {
    const { error } = await supabase.from('bloqueios').upsert({
      id: block.id,
      quarto_id: block.quarto_id,
      data_inicio: block.data_inicio,
      data_fim: block.data_fim,
      motivo: block.motivo,
      criado_por: block.criado_por || 'Sistema',
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteBlockFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('bloqueios').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - AUTOMAÇÕES
// ============================================================================
export async function fetchAutomationsFromSupabase(): Promise<AutomacaoMensagem[] | null> {
  try {
    const { data, error } = await supabase.from('automacoes').select('*');
    if (error || !data) return null;
    return data as AutomacaoMensagem[];
  } catch {
    return null;
  }
}

export async function upsertAutomationToSupabase(auto: AutomacaoMensagem): Promise<boolean> {
  try {
    const { error } = await supabase.from('automacoes').upsert({
      id: auto.id,
      titulo: auto.titulo,
      gatilho: auto.gatilho,
      canal: auto.canal,
      template: auto.template,
      ativo: auto.ativo !== false,
      variaveis_disponiveis: Array.isArray(auto.variaveis_disponiveis) ? auto.variaveis_disponiveis : [],
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - USUÁRIOS
// ============================================================================
export async function fetchUsersFromSupabase(): Promise<Usuario[] | null> {
  try {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error || !data) return null;
    return data as Usuario[];
  } catch {
    return null;
  }
}

export async function upsertUserToSupabase(user: Usuario): Promise<boolean> {
  try {
    const { error } = await supabase.from('usuarios').upsert({
      id: user.id,
      nome: user.nome,
      email: user.email,
      senha: user.senha || 'hotel123',
      tipo_usuario: user.tipo_usuario || 'recepcionista',
      cargo_titulo: user.cargo_titulo || null,
      telefone: user.telefone || null,
      ativo: user.ativo !== false,
      avatar: user.avatar || null,
      ultimo_acesso: user.ultimo_acesso || null,
      permissoes: Array.isArray(user.permissoes) ? user.permissoes : ['todas'],
      created_at: user.created_at || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteUserFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO - LOGS DE AUDITORIA & 2FA
// ============================================================================
export async function fetchSecurityLogsFromSupabase(): Promise<SecurityLogEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from('logs_seguranca')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (error || !data) return null;
    return data as SecurityLogEntry[];
  } catch {
    return null;
  }
}

export async function insertSecurityLogToSupabase(log: SecurityLogEntry): Promise<boolean> {
  try {
    const { error } = await supabase.from('logs_seguranca').insert({
      id: log.id,
      usuario_id: log.usuario_id || null,
      usuario_nome: log.usuario_nome || 'Sistema',
      usuario_email: log.usuario_email || 'sistema@hotel.com',
      usuario_cargo: log.usuario_cargo || null,
      operacao: log.operacao,
      detalhes: log.detalhes || '',
      categoria: log.categoria || 'Geral',
      metodo_2fa: log.metodo_2fa || null,
      ip_origem: log.ip_origem || null,
      sucesso: log.sucesso !== false,
      timestamp: log.timestamp || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// SERVIÇOS DE SINCRONIZAÇÃO E STORAGE - MÍDIA & FOTOS (media_uploads)
// ============================================================================

/**
 * Converte DataURL Base64 em Blob Binário para upload direto no Storage Supabase
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([uint8Array], { type: mime });
}

export async function fetchMediaUploadsFromSupabase(
  category?: string,
  roomId?: string
): Promise<MediaUploadRecord[] | null> {
  try {
    let query = supabase.from('media_uploads').select('*').order('created_at', { ascending: false });
    if (category) {
      query = query.eq('category', category);
    }
    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    const { data, error } = await query;
    if (error || !data) return null;
    return data as MediaUploadRecord[];
  } catch {
    return null;
  }
}

export async function upsertMediaUploadToSupabase(record: MediaUploadRecord): Promise<boolean> {
  try {
    const { error } = await supabase.from('media_uploads').upsert({
      id: record.id,
      file_name: record.file_name,
      url: record.url,
      storage_path: record.storage_path || null,
      category: record.category,
      room_id: record.room_id || null,
      is_cover: Boolean(record.is_cover),
      sort_order: Number(record.sort_order) || 0,
      width: record.width || null,
      height: record.height || null,
      aspect_ratio: record.aspect_ratio || null,
      file_size_bytes: record.file_size_bytes || null,
      mime_type: record.mime_type || 'image/jpeg',
      crop_data: record.crop_data || null,
      uploaded_by: record.uploaded_by || null,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteMediaUploadFromSupabase(id: string, storagePath?: string | null): Promise<boolean> {
  try {
    if (storagePath) {
      try {
        await supabase.storage.from('hotel-media').remove([storagePath]);
      } catch (storageErr) {
        console.warn('Não foi possível remover arquivo do Storage:', storageErr);
      }
    }
    const { error } = await supabase.from('media_uploads').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Envia uma foto diretamente para o Supabase Storage (Bucket 'hotel-media')
 * e salva o registro estruturado na tabela SQL 'media_uploads'.
 */
export async function uploadImageToSupabaseStorage({
  fileOrDataUrl,
  fileName,
  category,
  roomId,
  isCover = false,
  sortOrder = 0,
  width,
  height,
  aspectRatio,
  cropData,
  uploadedBy,
}: {
  fileOrDataUrl: File | Blob | string;
  fileName?: string;
  category: MediaCategory;
  roomId?: string | null;
  isCover?: boolean;
  sortOrder?: number;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  cropData?: Record<string, any> | null;
  uploadedBy?: string | null;
}): Promise<{ success: boolean; url: string; record?: MediaUploadRecord; error?: string }> {
  try {
    let blob: Blob;
    let actualName = fileName || `foto_${category}_${Date.now()}.jpg`;

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:')) {
        blob = dataUrlToBlob(fileOrDataUrl);
      } else {
        // Imagem já é uma URL HTTP -> salva apenas metadados na tabela
        const record: MediaUploadRecord = {
          id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          file_name: actualName,
          url: fileOrDataUrl,
          storage_path: null,
          category,
          room_id: roomId || null,
          is_cover: isCover,
          sort_order: sortOrder,
          width: width || null,
          height: height || null,
          aspect_ratio: aspectRatio || null,
          file_size_bytes: null,
          mime_type: 'image/jpeg',
          crop_data: cropData || null,
          uploaded_by: uploadedBy || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await upsertMediaUploadToSupabase(record);
        return { success: true, url: fileOrDataUrl, record };
      }
    } else {
      blob = fileOrDataUrl;
    }

    const fileExt = actualName.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = `${category}/${cleanFileName}`;

    let finalUrl = '';
    const { error: storageError } = await supabase.storage
      .from('hotel-media')
      .upload(storagePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (storageError) {
      console.warn('Storage hotel-media upload aviso:', storageError.message);
      if (typeof fileOrDataUrl === 'string') {
        finalUrl = fileOrDataUrl;
      }
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('hotel-media')
        .getPublicUrl(storagePath);
      finalUrl = publicUrlData?.publicUrl || '';
    }

    if (!finalUrl && typeof fileOrDataUrl === 'string') {
      finalUrl = fileOrDataUrl;
    }

    const record: MediaUploadRecord = {
      id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      file_name: actualName,
      url: finalUrl || (typeof fileOrDataUrl === 'string' ? fileOrDataUrl : ''),
      storage_path: storageError ? null : storagePath,
      category,
      room_id: roomId || null,
      is_cover: isCover,
      sort_order: sortOrder,
      width: width || null,
      height: height || null,
      aspect_ratio: aspectRatio || null,
      file_size_bytes: blob.size || null,
      mime_type: blob.type || 'image/jpeg',
      crop_data: cropData || null,
      uploaded_by: uploadedBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await upsertMediaUploadToSupabase(record);

    return {
      success: true,
      url: record.url,
      record,
    };
  } catch (err: any) {
    console.error('Erro no upload de foto para o Supabase:', err);
    return {
      success: false,
      url: typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '',
      error: err?.message || String(err),
    };
  }
}

// ============================================================================
// EXPORTAÇÃO E SEED EM MASSA (LOCAL -> SUPABASE) COM FEEDBACK DETALHADO
// ============================================================================
export interface TableExportResult {
  table: string;
  success: boolean;
  count: number;
  error?: string;
}

export interface SeedAllResponse {
  success: boolean;
  errors: string[];
  tableResults: TableExportResult[];
  insertedCounts: Record<string, number>;
  totalExported: number;
}

export async function seedAllDataToSupabase(data: {
  hotelConfig: HotelConfig;
  roomTypes: TipoQuarto[];
  rooms: Quarto[];
  guests: Hospede[];
  reservations: Reserva[];
  payments: Pagamento[];
  blocks: BloqueioQuarto[];
  automations: AutomacaoMensagem[];
  users: Usuario[];
  securityLogs: SecurityLogEntry[];
  mediaUploads?: MediaUploadRecord[];
}): Promise<SeedAllResponse> {
  const errors: string[] = [];
  const insertedCounts: Record<string, number> = {};
  const tableResults: TableExportResult[] = [];
  let totalExported = 0;

  // Função auxiliar de upsert com sanitização e relatório detalhado
  const exportTable = async (
    tableName: string,
    records: any[],
    sanitizer: (item: any) => any
  ): Promise<void> => {
    if (!records || records.length === 0) {
      tableResults.push({ table: tableName, success: true, count: 0 });
      return;
    }

    try {
      const sanitized = records.map(sanitizer);
      const { error } = await supabase.from(tableName).upsert(sanitized, { onConflict: 'id' });

      if (error) {
        let cleanErr = error.message;
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          cleanErr = `A tabela "${tableName}" ainda não foi criada no Supabase (Execute o script SQL).`;
        } else if (error.code === '42501' || error.message?.includes('row-level security')) {
          cleanErr = `Acesso bloqueado por RLS na tabela "${tableName}". Habilite a policy no script SQL.`;
        }
        errors.push(`${tableName}: ${cleanErr}`);
        tableResults.push({ table: tableName, success: false, count: 0, error: cleanErr });
      } else {
        insertedCounts[tableName] = sanitized.length;
        totalExported += sanitized.length;
        tableResults.push({ table: tableName, success: true, count: sanitized.length });
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`${tableName}: ${msg}`);
      tableResults.push({ table: tableName, success: false, count: 0, error: msg });
    }
  };

  try {
    // 1. hotel_config (Configurações e White-label)
    try {
      const { error: cfgErr } = await supabase.from('hotel_config').upsert({
        id: 'default_hotel',
        config: data.hotelConfig,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (cfgErr) {
        const msg = cfgErr.code === '42P01' ? 'Tabela "hotel_config" não existe no banco.' : cfgErr.message;
        errors.push(`hotel_config: ${msg}`);
        tableResults.push({ table: 'hotel_config', success: false, count: 0, error: msg });
      } else {
        insertedCounts['hotel_config'] = 1;
        totalExported += 1;
        tableResults.push({ table: 'hotel_config', success: true, count: 1 });
      }
    } catch (err: any) {
      errors.push(`hotel_config: ${err?.message || err}`);
      tableResults.push({ table: 'hotel_config', success: false, count: 0, error: err?.message || String(err) });
    }

    // 2. tipos_quarto (Categorias de Quarto)
    await exportTable('tipos_quarto', data.roomTypes, (t) => ({
      id: String(t.id),
      nome: String(t.nome),
      descricao: t.descricao || '',
      capacidade_padrao: Number(t.capacidade_padrao) || 2,
      icone: t.icone || 'BedDouble',
      comodidades_principais: Array.isArray(t.comodidades_principais) ? t.comodidades_principais : [],
    }));

    // 3. quartos (Acomodações - Depende de tipos_quarto)
    await exportTable('quartos', data.rooms, (q) => ({
      id: String(q.id),
      numero: String(q.numero),
      nome: String(q.nome),
      tipo_quarto_id: q.tipo_quarto_id ? String(q.tipo_quarto_id) : null,
      capacidade: Number(q.capacidade) || 2,
      valor_diaria: Number(q.valor_diaria) || 0,
      descricao: q.descricao || '',
      status: q.status || 'disponivel',
      ativo: q.ativo !== false,
      andar: Number(q.andar) || 1,
      fotos: Array.isArray(q.fotos) ? q.fotos : [],
      comodidades: Array.isArray(q.comodidades) ? q.comodidades : [],
      tamanho_m2: Number(q.tamanho_m2) || 30,
      vista: q.vista || '',
      cama: q.cama || '',
      fechadura_pin: q.fechadura_pin || null,
      updated_at: new Date().toISOString(),
    }));

    // 4. hospedes (CRM de Clientes)
    await exportTable('hospedes', data.guests, (h) => ({
      id: String(h.id),
      nome: String(h.nome),
      email: String(h.email),
      telefone: String(h.telefone),
      documento: String(h.documento),
      data_nascimento: h.data_nascimento || null,
      endereco: h.endereco || null,
      cidade: h.cidade || null,
      estado: h.estado || null,
      nacionalidade: h.nacionalidade || 'Brasileira',
      notas_preferencias: h.notas_preferencias || null,
      vip: Boolean(h.vip),
      total_estadias: Number(h.total_estadias) || 1,
      created_at: h.created_at || new Date().toISOString(),
    }));

    // 5. reservas (Depende de hospedes e quartos)
    await exportTable('reservas', data.reservations, (r) => ({
      id: String(r.id),
      codigo: String(r.codigo),
      hospede_id: String(r.hospede_id),
      quarto_id: String(r.quarto_id),
      checkin: String(r.checkin),
      checkout: String(r.checkout),
      quantidade_hospedes: Number(r.quantidade_hospedes) || 1,
      adultos: Number(r.adultos) || 1,
      criancas: Number(r.criancas) || 0,
      valor_diarias: Number(r.valor_diarias) || 0,
      valor_taxas: Number(r.valor_taxas) || 0,
      valor_consumo: Number(r.valor_consumo) || 0,
      valor_total: Number(r.valor_total) || 0,
      status: r.status || 'confirmada',
      forma_pagamento: r.forma_pagamento || null,
      pagamento_id: r.pagamento_id || null,
      observacoes: r.observacoes || '',
      checkin_horario: r.checkin_horario || null,
      checkout_horario: r.checkout_horario || null,
      consumo_itens: Array.isArray(r.consumo_itens) ? r.consumo_itens : [],
      pin_fechadura: r.pin_fechadura || null,
      created_at: r.created_at || new Date().toISOString(),
    }));

    // 6. pagamentos (Depende de reservas)
    await exportTable('pagamentos', data.payments, (p) => ({
      id: String(p.id),
      reserva_id: String(p.reserva_id),
      valor: Number(p.valor) || 0,
      metodo: String(p.metodo),
      status: p.status || 'aprovado',
      codigo_transacao: p.codigo_transacao || '',
      parcelas: Number(p.parcelas) || 1,
      data_pagamento: p.data_pagamento || new Date().toISOString(),
    }));

    // 7. bloqueios (Depende de quartos)
    await exportTable('bloqueios', data.blocks, (b) => ({
      id: String(b.id),
      quarto_id: String(b.quarto_id),
      data_inicio: String(b.data_inicio),
      data_fim: String(b.data_fim),
      motivo: String(b.motivo),
      criado_por: b.criado_por || 'Sistema',
      created_at: new Date().toISOString(),
    }));

    // 8. automacoes
    await exportTable('automacoes', data.automations, (a) => ({
      id: String(a.id),
      titulo: String(a.titulo),
      gatilho: String(a.gatilho),
      canal: String(a.canal),
      template: String(a.template),
      ativo: a.ativo !== false,
      variaveis_disponiveis: Array.isArray(a.variaveis_disponiveis) ? a.variaveis_disponiveis : [],
      created_at: new Date().toISOString(),
    }));

    // 9. usuarios
    await exportTable('usuarios', data.users, (u) => ({
      id: String(u.id),
      nome: String(u.nome),
      email: String(u.email),
      senha: u.senha || 'hotel123',
      tipo_usuario: u.tipo_usuario || 'recepcionista',
      cargo_titulo: u.cargo_titulo || null,
      telefone: u.telefone || null,
      ativo: u.ativo !== false,
      avatar: u.avatar || null,
      ultimo_acesso: u.ultimo_acesso || null,
      permissoes: Array.isArray(u.permissoes) ? u.permissoes : ['todas'],
      created_at: u.created_at || new Date().toISOString(),
    }));

    // 10. logs_seguranca
    await exportTable('logs_seguranca', data.securityLogs, (l) => ({
      id: String(l.id),
      usuario_id: l.usuario_id || null,
      usuario_nome: l.usuario_nome || 'Sistema',
      usuario_email: l.usuario_email || 'sistema@hotel.com',
      usuario_cargo: l.usuario_cargo || null,
      operacao: String(l.operacao),
      detalhes: l.detalhes || '',
      categoria: l.categoria || 'Geral',
      metodo_2fa: l.metodo_2fa || null,
      ip_origem: l.ip_origem || null,
      sucesso: l.sucesso !== false,
      timestamp: l.timestamp || new Date().toISOString(),
    }));

    // 11. media_uploads (Mídia e Galeria de Fotos no Supabase)
    if (data.mediaUploads && data.mediaUploads.length > 0) {
      await exportTable('media_uploads', data.mediaUploads, (m) => ({
        id: String(m.id),
        file_name: String(m.file_name),
        url: String(m.url),
        storage_path: m.storage_path || null,
        category: m.category,
        room_id: m.room_id || null,
        is_cover: Boolean(m.is_cover),
        sort_order: Number(m.sort_order) || 0,
        width: m.width || null,
        height: m.height || null,
        aspect_ratio: m.aspect_ratio || null,
        file_size_bytes: m.file_size_bytes || null,
        mime_type: m.mime_type || 'image/jpeg',
        crop_data: m.crop_data || null,
        uploaded_by: m.uploaded_by || null,
        created_at: m.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } else {
      tableResults.push({ table: 'media_uploads', success: true, count: 0 });
    }

  } catch (err: any) {
    errors.push(`Erro geral inesperado: ${err?.message || err}`);
  }

  return {
    success: errors.length === 0,
    errors,
    tableResults,
    insertedCounts,
    totalExported,
  };
}
