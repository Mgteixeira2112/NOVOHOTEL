-- ============================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS SUPABASE - HOTEL PMS & RESERVAS
-- Domínio: goncalves.guiadamantiqueira.com.br
-- Execute este script no SQL Editor do seu painel Supabase:
-- https://supabase.com/dashboard/project/awyxubhwtdgwnssvajnr/sql
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
    icone TEXT,
    comodidades_principais TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Quartos / Acomodações
CREATE TABLE IF NOT EXISTS public.quartos (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo_quarto_id TEXT REFERENCES public.tipos_quarto(id) ON DELETE SET NULL,
    capacidade INTEGER NOT NULL DEFAULT 2,
    valor_diaria NUMERIC(10, 2) NOT NULL DEFAULT 0,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'disponivel',
    ativo BOOLEAN DEFAULT TRUE,
    andar INTEGER DEFAULT 1,
    fotos TEXT[],
    comodidades TEXT[],
    tamanho_m2 NUMERIC(6, 2),
    vista TEXT,
    cama TEXT,
    fechadura_pin TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Hóspedes (CRM)
CREATE TABLE IF NOT EXISTS public.hospedes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    documento TEXT NOT NULL,
    data_nascimento TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    nacionalidade TEXT DEFAULT 'Brasileira',
    notas_preferencias TEXT,
    vip BOOLEAN DEFAULT FALSE,
    total_estadias INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Reservas
CREATE TABLE IF NOT EXISTS public.reservas (
    id TEXT PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    hospede_id TEXT REFERENCES public.hospedes(id) ON DELETE RESTRICT,
    quarto_id TEXT REFERENCES public.quartos(id) ON DELETE RESTRICT,
    checkin DATE NOT NULL,
    checkout DATE NOT NULL,
    quantidade_hospedes INTEGER NOT NULL DEFAULT 1,
    adultos INTEGER NOT NULL DEFAULT 1,
    criancas INTEGER DEFAULT 0,
    valor_diarias NUMERIC(10, 2) NOT NULL DEFAULT 0,
    valor_taxas NUMERIC(10, 2) DEFAULT 0,
    valor_consumo NUMERIC(10, 2) DEFAULT 0,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmada',
    forma_pagamento TEXT,
    pagamento_id TEXT,
    observacoes TEXT,
    checkin_horario TEXT,
    checkout_horario TEXT,
    consumo_itens JSONB DEFAULT '[]'::JSONB,
    pin_fechadura TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
    id TEXT PRIMARY KEY,
    reserva_id TEXT REFERENCES public.reservas(id) ON DELETE CASCADE,
    valor NUMERIC(10, 2) NOT NULL DEFAULT 0,
    metodo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aprovado',
    codigo_transacao TEXT,
    parcelas INTEGER DEFAULT 1,
    data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Bloqueios & Manutenções de Quarto
CREATE TABLE IF NOT EXISTS public.bloqueios (
    id TEXT PRIMARY KEY,
    quarto_id TEXT REFERENCES public.quartos(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    motivo TEXT NOT NULL,
    criado_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Automações de Mensagens (WhatsApp / Email)
CREATE TABLE IF NOT EXISTS public.automacoes (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    gatilho TEXT NOT NULL,
    canal TEXT NOT NULL,
    template TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    variaveis_disponiveis TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de Usuários do Sistema & Permissões
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT,
    tipo_usuario TEXT NOT NULL DEFAULT 'recepcionista',
    cargo_titulo TEXT,
    telefone TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    avatar TEXT,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    permissoes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Logs de Auditoria & Segurança 2FA
CREATE TABLE IF NOT EXISTS public.logs_seguranca (
    id TEXT PRIMARY KEY,
    usuario_id TEXT,
    usuario_nome TEXT,
    usuario_email TEXT,
    usuario_cargo TEXT,
    operacao TEXT NOT NULL,
    detalhes TEXT,
    categoria TEXT,
    metodo_2fa TEXT,
    ip_origem TEXT,
    sucesso BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) & POLÍTICAS PÚBLICAS PARA CHAVE ANON
-- ============================================================================

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

-- Políticas de Acesso Total para a Chave Anon da Aplicação Web
CREATE POLICY "Permitir acesso completo hotel_config" ON public.hotel_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo tipos_quarto" ON public.tipos_quarto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo quartos" ON public.quartos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo hospedes" ON public.hospedes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo pagamentos" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo bloqueios" ON public.bloqueios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo automacoes" ON public.automacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo logs_seguranca" ON public.logs_seguranca FOR ALL USING (true) WITH CHECK (true);
