import { 
  FrigobarProduct, 
  FrigobarTemplateQuarto, 
  FornecedorFrigobar, 
  FrigobarMovimentacao, 
  FrigobarAuditoriaRegistro, 
  FrigobarPreferenciaHospede,
  FrigobarQuarto
} from '../types/frigobar';

export const INITIAL_FRIGOBAR_PRODUCTS: FrigobarProduct[] = [
  {
    id: 'prod-001',
    codigo: 'AG-01',
    nome: 'Água Mineral sem Gás 500ml (Caxambu)',
    categoria: 'bebidas_nao_alcoolicas',
    preco_custo: 1.80,
    preco_venda: 6.00,
    estoque_central: 140,
    estoque_alocado_quartos: 32,
    estoque_minimo: 40,
    estoque_maximo: 200,
    unidade: 'garrafa',
    validade_proxima: '2026-12-15',
    lote_atual: 'CX-2026-88',
    fornecedor_padrao: 'Distribuidora Mantiqueira de Águas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Água mineral natural da fonte pura das montanhas de Minas',
    codigo_barras: '7891000100012'
  },
  {
    id: 'prod-002',
    codigo: 'AG-02',
    nome: 'Água Mineral com Gás 500ml (Caxambu)',
    categoria: 'bebidas_nao_alcoolicas',
    preco_custo: 2.10,
    preco_venda: 7.00,
    estoque_central: 110,
    estoque_alocado_quartos: 28,
    estoque_minimo: 30,
    estoque_maximo: 180,
    unidade: 'garrafa',
    validade_proxima: '2026-11-20',
    lote_atual: 'CXG-2026-45',
    fornecedor_padrao: 'Distribuidora Mantiqueira de Águas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Água mineral levemente gaseificada',
    codigo_barras: '7891000100029'
  },
  {
    id: 'prod-003',
    codigo: 'REF-01',
    nome: 'Coca-Cola Original Lata 350ml',
    categoria: 'bebidas_nao_alcoolicas',
    preco_custo: 3.40,
    preco_venda: 9.00,
    estoque_central: 95,
    estoque_alocado_quartos: 32,
    estoque_minimo: 35,
    estoque_maximo: 160,
    unidade: 'lata',
    validade_proxima: '2026-09-30',
    lote_atual: 'KO-2026-99',
    fornecedor_padrao: 'Distribuidora Vale do Sapucaí Bebidas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Refrigerante de cola tradicional',
    codigo_barras: '7894900010015'
  },
  {
    id: 'prod-004',
    codigo: 'REF-02',
    nome: 'Coca-Cola Sem Açúcar Lata 350ml',
    categoria: 'bebidas_nao_alcoolicas',
    preco_custo: 3.40,
    preco_venda: 9.00,
    estoque_central: 88,
    estoque_alocado_quartos: 26,
    estoque_minimo: 30,
    estoque_maximo: 150,
    unidade: 'lata',
    validade_proxima: '2026-09-30',
    lote_atual: 'KOZ-2026-12',
    fornecedor_padrao: 'Distribuidora Vale do Sapucaí Bebidas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Refrigerante de cola zero calorias',
    codigo_barras: '7894900010022'
  },
  {
    id: 'prod-005',
    codigo: 'REF-03',
    nome: 'Guaraná Antarctica Lata 350ml',
    categoria: 'bebidas_nao_alcoolicas',
    preco_custo: 3.10,
    preco_venda: 8.50,
    estoque_central: 72,
    estoque_alocado_quartos: 24,
    estoque_minimo: 25,
    estoque_maximo: 140,
    unidade: 'lata',
    validade_proxima: '2026-10-18',
    lote_atual: 'AMB-2026-33',
    fornecedor_padrao: 'Distribuidora Vale do Sapucaí Bebidas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'O sabor autêntico do guaraná brasileiro',
    codigo_barras: '7891991000826'
  },
  {
    id: 'prod-006',
    codigo: 'EN-01',
    nome: 'Red Bull Energy Drink 250ml',
    categoria: 'bebidas_nao_alcoolicas',
    preco_custo: 7.20,
    preco_venda: 18.00,
    estoque_central: 45,
    estoque_alocado_quartos: 18,
    estoque_minimo: 20,
    estoque_maximo: 90,
    unidade: 'lata',
    validade_proxima: '2027-01-10',
    lote_atual: 'RB-2026-04',
    fornecedor_padrao: 'Distribuidora Vale do Sapucaí Bebidas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Bebida energética estimulante',
    codigo_barras: '9002490100070'
  },
  {
    id: 'prod-007',
    codigo: 'CER-01',
    nome: 'Cerveja Heineken Long Neck 330ml',
    categoria: 'cervejas',
    preco_custo: 5.50,
    preco_venda: 15.00,
    estoque_central: 84,
    estoque_alocado_quartos: 32,
    estoque_minimo: 30,
    estoque_maximo: 160,
    unidade: 'garrafa',
    validade_proxima: '2026-08-30',
    lote_atual: 'HN-2026-55',
    fornecedor_padrao: 'Distribuidora Vale do Sapucaí Bebidas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Cerveja premium lager puro malte',
    codigo_barras: '7896045505018'
  },
  {
    id: 'prod-008',
    codigo: 'CER-02',
    nome: 'Cerveja Artesanal Mantiqueira IPA 500ml',
    categoria: 'cervejas',
    preco_custo: 9.80,
    preco_venda: 24.00,
    estoque_central: 28,
    estoque_alocado_quartos: 12,
    estoque_minimo: 15,
    estoque_maximo: 60,
    unidade: 'garrafa',
    validade_proxima: '2026-07-22',
    lote_atual: 'IPA-MT-08',
    fornecedor_padrao: 'Cervejaria Mantiqueira Sul de Minas',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Cerveja artesanal local com notas cítricas e lúpulo aromático',
    codigo_barras: '7898950001099'
  },
  {
    id: 'prod-009',
    codigo: 'VIN-01',
    nome: 'Vinho Tinto Chileno Reserva 375ml',
    categoria: 'vinhos_espumantes',
    preco_custo: 24.00,
    preco_venda: 58.00,
    estoque_central: 18,
    estoque_alocado_quartos: 8,
    estoque_minimo: 10,
    estoque_maximo: 40,
    unidade: 'garrafa',
    validade_proxima: '2028-12-31',
    lote_atual: 'CS-2024-V2',
    fornecedor_padrao: 'Minas Vinhos & Importados',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'Cabernet Sauvignon encorpado, meia garrafa ideal para casal',
    codigo_barras: '7804300001201'
  },
  {
    id: 'prod-010',
    codigo: 'VIN-02',
    nome: 'Espumante Chandon Brut Baby 187ml',
    categoria: 'vinhos_espumantes',
    preco_custo: 29.00,
    preco_venda: 68.00,
    estoque_central: 14,
    estoque_alocado_quartos: 6,
    estoque_minimo: 8,
    estoque_maximo: 35,
    unidade: 'garrafa',
    validade_proxima: '2027-06-30',
    lote_atual: 'CH-BABY-25',
    fornecedor_padrao: 'Minas Vinhos & Importados',
    ativo: true,
    temperatura_servico: 'gelada',
    descricao: 'Espumante brut refinado em garrafa baby individual',
    codigo_barras: '7891048030018'
  },
  {
    id: 'prod-011',
    codigo: 'SNK-01',
    nome: 'Batata Pringles Original 40g',
    categoria: 'snacks_salgados',
    preco_custo: 5.80,
    preco_venda: 14.00,
    estoque_central: 42,
    estoque_alocado_quartos: 20,
    estoque_minimo: 20,
    estoque_maximo: 80,
    unidade: 'pacote',
    validade_proxima: '2026-11-15',
    lote_atual: 'PRG-2026-01',
    fornecedor_padrao: 'Alimentos & Conveniência Itajubá',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'Snack de batata crocante em tubo compacto',
    codigo_barras: '5053990100012'
  },
  {
    id: 'prod-012',
    codigo: 'SNK-02',
    nome: 'Castanha de Caju Torrada e Salgada 60g',
    categoria: 'snacks_salgados',
    preco_custo: 6.50,
    preco_venda: 16.00,
    estoque_central: 36,
    estoque_alocado_quartos: 16,
    estoque_minimo: 15,
    estoque_maximo: 70,
    unidade: 'pacote',
    validade_proxima: '2026-10-05',
    lote_atual: 'CSH-2026-09',
    fornecedor_padrao: 'Alimentos & Conveniência Itajubá',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'Castanhas de caju selecionadas de primeira linha',
    codigo_barras: '7898123000451'
  },
  {
    id: 'prod-013',
    codigo: 'DOC-01',
    nome: 'Chocolate Milka Alpine Milk 100g',
    categoria: 'snacks_doces',
    preco_custo: 9.50,
    preco_venda: 22.00,
    estoque_central: 30,
    estoque_alocado_quartos: 14,
    estoque_minimo: 12,
    estoque_maximo: 60,
    unidade: 'pacote',
    validade_proxima: '2026-09-12',
    lote_atual: 'MLK-2026-77',
    fornecedor_padrao: 'Alimentos & Conveniência Itajubá',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'Chocolate suíço ao leite puro alpino',
    codigo_barras: '7622210004509'
  },
  {
    id: 'prod-014',
    codigo: 'DOC-02',
    nome: 'Mini Pote Doce de Leite Viçosa Gourmet 120g',
    categoria: 'snacks_doces',
    preco_custo: 7.90,
    preco_venda: 19.00,
    estoque_central: 24,
    estoque_alocado_quartos: 12,
    estoque_minimo: 10,
    estoque_maximo: 50,
    unidade: 'un',
    validade_proxima: '2026-12-20',
    lote_atual: 'VIC-2026-03',
    fornecedor_padrao: 'Alimentos & Conveniência Itajubá',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'O autêntico doce de leite premiado de Minas Gerais',
    codigo_barras: '7898012000881'
  },
  {
    id: 'prod-015',
    codigo: 'KIT-01',
    nome: 'Kit Dental Curaprox + Fio Dental',
    categoria: 'conveniencia_higiene',
    preco_custo: 12.00,
    preco_venda: 25.00,
    estoque_central: 22,
    estoque_alocado_quartos: 10,
    estoque_minimo: 8,
    estoque_maximo: 40,
    unidade: 'kit',
    validade_proxima: '2028-12-31',
    lote_atual: 'CUR-2026-90',
    fornecedor_padrao: 'Distribuidora Hospitalar & Higiene Sul',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'Escova ultramacia suíça e creme dental compacto',
    codigo_barras: '7612412000119'
  },
  {
    id: 'prod-016',
    codigo: 'KIT-02',
    nome: 'Kit Noite Romântica (Velas + Bombons + Taças)',
    categoria: 'kits_especiais',
    preco_custo: 38.00,
    preco_venda: 89.00,
    estoque_central: 8,
    estoque_alocado_quartos: 4,
    estoque_minimo: 4,
    estoque_maximo: 20,
    unidade: 'kit',
    validade_proxima: '2026-12-31',
    lote_atual: 'ROM-2026-01',
    fornecedor_padrao: 'Alimentos & Conveniência Itajubá',
    ativo: true,
    temperatura_servico: 'ambiente',
    descricao: 'Kit surpresa para casais e noites especiais no flat',
    codigo_barras: '7899999000123'
  }
];

export const INITIAL_FRIGOBAR_FORNECEDORES: FornecedorFrigobar[] = [
  {
    id: 'forn-01',
    nome_fantasia: 'Distribuidora Vale do Sapucaí Bebidas',
    razao_social: 'Vale do Sapucaí Distribuidora de Bebidas Ltda',
    cnpj: '18.442.910/0001-52',
    contato_vendedor: 'Rodrigo Medeiros',
    telefone: '(35) 99841-2290',
    email: 'comercial@valesapucaibebidas.com.br',
    produtos_fornecidos: ['Coca-Cola', 'Guaraná', 'Red Bull', 'Heineken'],
    prazo_entrega_dias: 1,
    condicao_pagamento: 'Boleto 28 dias'
  },
  {
    id: 'forn-02',
    nome_fantasia: 'Distribuidora Mantiqueira de Águas',
    razao_social: 'Fontes da Mantiqueira Envasadora Ltda',
    cnpj: '22.119.340/0001-18',
    contato_vendedor: 'Fernanda Pires',
    telefone: '(35) 98833-1144',
    email: 'pedidos@aguasmantiqueira.com.br',
    produtos_fornecidos: ['Água Caxambu com e sem gás'],
    prazo_entrega_dias: 2,
    condicao_pagamento: 'PIX à vista com 5% desconto ou Boleto 15D'
  },
  {
    id: 'forn-03',
    nome_fantasia: 'Minas Vinhos & Importados',
    razao_social: 'Grand Cru Distribuidora Sul Mineira Ltda',
    cnpj: '09.821.554/0001-90',
    contato_vendedor: 'Marcelo Rossi',
    telefone: '(35) 99120-7733',
    email: 'vendas@minasvinhos.com.br',
    produtos_fornecidos: ['Vinho Tinto Chileno', 'Espumante Chandon Baby'],
    prazo_entrega_dias: 3,
    condicao_pagamento: 'Faturado 30/60 dias'
  },
  {
    id: 'forn-04',
    nome_fantasia: 'Alimentos & Conveniência Itajubá',
    razao_social: 'Conveniência Itajubá Atacado de Alimentos Eireli',
    cnpj: '31.288.741/0001-09',
    contato_vendedor: 'Cláudia Castro',
    telefone: '(35) 99765-4421',
    email: 'atendimento@convenienciaitajuba.com.br',
    produtos_fornecidos: ['Pringles', 'Castanhas', 'Chocolate Milka', 'Doce de Leite Viçosa'],
    prazo_entrega_dias: 1,
    condicao_pagamento: 'Boleto 21 dias'
  }
];

export const INITIAL_FRIGOBAR_TEMPLATES: FrigobarTemplateQuarto[] = [
  {
    id: 'tpl-std',
    tipo_quarto_id: 'standard',
    tipo_quarto_nome: 'Quarto Standard & Executivo',
    descricao: 'Mix essencial para hóspedes executivos e estadias rápidas',
    itens_padrao: [
      { produto_id: 'prod-001', quantidade: 2 }, // Água sem gás
      { produto_id: 'prod-002', quantidade: 2 }, // Água com gás
      { produto_id: 'prod-003', quantidade: 2 }, // Coca-Cola
      { produto_id: 'prod-004', quantidade: 2 }, // Coca Zero
      { produto_id: 'prod-005', quantidade: 1 }, // Guaraná
      { produto_id: 'prod-007', quantidade: 2 }, // Heineken
      { produto_id: 'prod-011', quantidade: 1 }, // Pringles
      { produto_id: 'prod-012', quantidade: 1 }, // Castanha
      { produto_id: 'prod-013', quantidade: 1 }, // Chocolate
    ]
  },
  {
    id: 'tpl-luxo',
    tipo_quarto_id: 'luxo',
    tipo_quarto_nome: 'Suíte Luxo & Master',
    descricao: 'Mix completo com vinhos finos, cervejas artesanais e doces gourmet',
    itens_padrao: [
      { produto_id: 'prod-001', quantidade: 3 }, // Água sem gás
      { produto_id: 'prod-002', quantidade: 2 }, // Água com gás
      { produto_id: 'prod-003', quantidade: 2 }, // Coca-Cola
      { produto_id: 'prod-004', quantidade: 2 }, // Coca Zero
      { produto_id: 'prod-006', quantidade: 2 }, // Red Bull
      { produto_id: 'prod-007', quantidade: 3 }, // Heineken
      { produto_id: 'prod-008', quantidade: 2 }, // Artesanal IPA
      { produto_id: 'prod-009', quantidade: 1 }, // Vinho Tinto
      { produto_id: 'prod-010', quantidade: 1 }, // Chandon Baby
      { produto_id: 'prod-011', quantidade: 2 }, // Pringles
      { produto_id: 'prod-012', quantidade: 2 }, // Castanhas
      { produto_id: 'prod-013', quantidade: 2 }, // Chocolate
      { produto_id: 'prod-014', quantidade: 1 }, // Doce de Leite Viçosa
      { produto_id: 'prod-015', quantidade: 1 }, // Kit Dental
    ]
  }
];

export const INITIAL_FRIGOBAR_QUARTOS: FrigobarQuarto[] = [
  {
    quarto_id: 'room-101',
    quarto_numero: '101',
    status: 'abastecido',
    ultima_verificacao: '2026-08-24 10:15',
    verificado_por: 'Maria Aparecida (Governança)',
    itens: [
      { produto_id: 'prod-001', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-002', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-003', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-004', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-005', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-007', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-011', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-012', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-013', quantidade_padrao: 1, quantidade_atual: 1 },
    ]
  },
  {
    quarto_id: 'room-102',
    quarto_numero: '102',
    status: 'precisa_reposicao',
    ultima_verificacao: '2026-08-24 09:30',
    verificado_por: 'Renata Souza (Camareira)',
    observacoes: 'Hóspede consumiu 2 Heinekens e 1 Água sem gás ontem à noite',
    itens: [
      { produto_id: 'prod-001', quantidade_padrao: 2, quantidade_atual: 1 }, // falta 1
      { produto_id: 'prod-002', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-003', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-004', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-005', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-007', quantidade_padrao: 2, quantidade_atual: 0 }, // falta 2
      { produto_id: 'prod-011', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-012', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-013', quantidade_padrao: 1, quantidade_atual: 1 },
    ]
  },
  {
    quarto_id: 'room-201',
    quarto_numero: '201',
    status: 'abastecido',
    ultima_verificacao: '2026-08-24 11:00',
    verificado_por: 'Maria Aparecida (Governança)',
    itens: [
      { produto_id: 'prod-001', quantidade_padrao: 3, quantidade_atual: 3 },
      { produto_id: 'prod-002', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-003', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-004', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-006', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-007', quantidade_padrao: 3, quantidade_atual: 3 },
      { produto_id: 'prod-008', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-009', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-010', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-011', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-012', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-013', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-014', quantidade_padrao: 1, quantidade_atual: 1 },
    ]
  },
  {
    quarto_id: 'room-202',
    quarto_numero: '202',
    status: 'precisa_reposicao',
    ultima_verificacao: '2026-08-24 08:45',
    verificado_por: 'Renata Souza (Camareira)',
    observacoes: 'Consumo de vinho e castanha no check-out hoje',
    itens: [
      { produto_id: 'prod-001', quantidade_padrao: 3, quantidade_atual: 2 },
      { produto_id: 'prod-002', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-003', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-004', quantidade_padrao: 2, quantidade_atual: 1 },
      { produto_id: 'prod-006', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-007', quantidade_padrao: 3, quantidade_atual: 1 },
      { produto_id: 'prod-008', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-009', quantidade_padrao: 1, quantidade_atual: 0 }, // falta vinho
      { produto_id: 'prod-010', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-011', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-012', quantidade_padrao: 2, quantidade_atual: 1 }, // falta castanha
      { produto_id: 'prod-013', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-014', quantidade_padrao: 1, quantidade_atual: 1 },
    ]
  },
  {
    quarto_id: 'room-301',
    quarto_numero: '301',
    status: 'abastecido',
    ultima_verificacao: '2026-08-23 16:30',
    verificado_por: 'Maria Aparecida (Governança)',
    itens: [
      { produto_id: 'prod-001', quantidade_padrao: 3, quantidade_atual: 3 },
      { produto_id: 'prod-002', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-003', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-004', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-006', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-007', quantidade_padrao: 3, quantidade_atual: 3 },
      { produto_id: 'prod-008', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-009', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-010', quantidade_padrao: 1, quantidade_atual: 1 },
      { produto_id: 'prod-011', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-012', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-013', quantidade_padrao: 2, quantidade_atual: 2 },
      { produto_id: 'prod-014', quantidade_padrao: 1, quantidade_atual: 1 },
    ]
  }
];

export const INITIAL_FRIGOBAR_MOVIMENTACOES: FrigobarMovimentacao[] = [
  {
    id: 'mov-001',
    data_hora: '2026-08-24 09:35:00',
    tipo: 'saida_consumo_hospede',
    produto_id: 'prod-007',
    produto_nome: 'Cerveja Heineken Long Neck 330ml',
    quantidade: 2,
    valor_unitario_custo: 5.50,
    valor_unitario_venda: 15.00,
    valor_total: 30.00,
    quarto_id: 'room-102',
    quarto_numero: '102',
    reserva_id: 'res-002',
    codigo_reserva: 'RES-8821',
    hospede_id: 'hosp-02',
    hospede_nome: 'Lucas Silveira',
    responsavel_nome: 'Renata Souza (Camareira)',
    motivo: 'Consumo aferido na auditoria matinal do quarto',
    observacoes: 'Lançado no extrato da reserva e deduzido do frigobar'
  },
  {
    id: 'mov-002',
    data_hora: '2026-08-24 09:35:00',
    tipo: 'saida_consumo_hospede',
    produto_id: 'prod-001',
    produto_nome: 'Água Mineral sem Gás 500ml (Caxambu)',
    quantidade: 1,
    valor_unitario_custo: 1.80,
    valor_unitario_venda: 6.00,
    valor_total: 6.00,
    quarto_id: 'room-102',
    quarto_numero: '102',
    reserva_id: 'res-002',
    codigo_reserva: 'RES-8821',
    hospede_id: 'hosp-02',
    hospede_nome: 'Lucas Silveira',
    responsavel_nome: 'Renata Souza (Camareira)',
    motivo: 'Consumo aferido na auditoria matinal do quarto',
    observacoes: 'Lançado no extrato da reserva e deduzido do frigobar'
  },
  {
    id: 'mov-003',
    data_hora: '2026-08-24 08:50:00',
    tipo: 'saida_consumo_hospede',
    produto_id: 'prod-009',
    produto_nome: 'Vinho Tinto Chileno Reserva 375ml',
    quantidade: 1,
    valor_unitario_custo: 24.00,
    valor_unitario_venda: 58.00,
    valor_total: 58.00,
    quarto_id: 'room-202',
    quarto_numero: '202',
    reserva_id: 'res-005',
    codigo_reserva: 'RES-9014',
    hospede_id: 'hosp-05',
    hospede_nome: 'Camila Fernandes',
    responsavel_nome: 'Recepção (Check-out)',
    motivo: 'Conferência no check-out do hóspede',
    observacoes: 'Pago no cartão de débito no balcão'
  },
  {
    id: 'mov-004',
    data_hora: '2026-08-23 14:20:00',
    tipo: 'entrada_fornecedor',
    produto_id: 'prod-003',
    produto_nome: 'Coca-Cola Original Lata 350ml',
    quantidade: 48,
    valor_unitario_custo: 3.40,
    valor_unitario_venda: 9.00,
    valor_total: 163.20,
    responsavel_nome: 'Carlos Eduardo (Gerente)',
    motivo: 'Entrada de compra NF-e 44921',
    nota_fiscal: 'NF-e 44921 / Vale do Sapucaí',
    observacoes: 'Entrada física conferida no Almoxarifado Central'
  },
  {
    id: 'mov-005',
    data_hora: '2026-08-23 14:20:00',
    tipo: 'entrada_fornecedor',
    produto_id: 'prod-007',
    produto_nome: 'Cerveja Heineken Long Neck 330ml',
    quantidade: 48,
    valor_unitario_custo: 5.50,
    valor_unitario_venda: 15.00,
    valor_total: 264.00,
    responsavel_nome: 'Carlos Eduardo (Gerente)',
    motivo: 'Entrada de compra NF-e 44921',
    nota_fiscal: 'NF-e 44921 / Vale do Sapucaí',
    observacoes: 'Entrada física conferida no Almoxarifado Central'
  },
  {
    id: 'mov-006',
    data_hora: '2026-08-23 16:40:00',
    tipo: 'transferencia_reposicao',
    produto_id: 'prod-007',
    produto_nome: 'Cerveja Heineken Long Neck 330ml',
    quantidade: 3,
    valor_unitario_custo: 5.50,
    valor_unitario_venda: 15.00,
    valor_total: 45.00,
    quarto_id: 'room-301',
    quarto_numero: '301',
    responsavel_nome: 'Maria Aparecida (Governança)',
    motivo: 'Reposição completa para preparação de check-in VIP',
    observacoes: 'Almoxarifado Central -> Frigobar Quarto 301'
  },
  {
    id: 'mov-007',
    data_hora: '2026-08-22 11:15:00',
    tipo: 'avaria_quebra',
    produto_id: 'prod-008',
    produto_nome: 'Cerveja Artesanal Mantiqueira IPA 500ml',
    quantidade: 1,
    valor_unitario_custo: 9.80,
    valor_unitario_venda: 24.00,
    valor_total: 9.80,
    responsavel_nome: 'Maria Aparecida (Governança)',
    motivo: 'Garrafa quebrou durante manuseio no depósito',
    observacoes: 'Baixa por avaria registrada com autorização da gerência'
  },
  {
    id: 'mov-008',
    data_hora: '2026-08-21 17:00:00',
    tipo: 'cortesia_gerencia',
    produto_id: 'prod-010',
    produto_nome: 'Espumante Chandon Brut Baby 187ml',
    quantidade: 1,
    valor_unitario_custo: 29.00,
    valor_unitario_venda: 68.00,
    valor_total: 29.00,
    quarto_id: 'room-201',
    quarto_numero: '201',
    hospede_nome: 'Mariana Duarte (Hóspede VIP Lua de Mel)',
    responsavel_nome: 'Carlos Eduardo (Gerente)',
    motivo: 'Cortesia de Boas-Vindas para casal em Lua de Mel',
    observacoes: 'Autorizado pela Diretoria'
  }
];

export const INITIAL_FRIGOBAR_AUDITORIAS: FrigobarAuditoriaRegistro[] = [
  {
    id: 'aud-001',
    quarto_id: 'room-102',
    quarto_numero: '102',
    reserva_id: 'res-002',
    codigo_reserva: 'RES-8821',
    hospede_id: 'hosp-02',
    hospede_nome: 'Lucas Silveira',
    data_hora: '2026-08-24 09:30',
    responsavel_nome: 'Renata Souza (Camareira)',
    itens_consumidos: [
      {
        produto_id: 'prod-007',
        produto_nome: 'Cerveja Heineken Long Neck 330ml',
        quantidade: 2,
        valor_unitario: 15.00,
        subtotal: 30.00
      },
      {
        produto_id: 'prod-001',
        produto_nome: 'Água Mineral sem Gás 500ml (Caxambu)',
        quantidade: 1,
        valor_unitario: 6.00,
        subtotal: 6.00
      }
    ],
    valor_total_consumo: 36.00,
    lancado_na_reserva: true,
    reposicao_efetuada: false,
    observacoes: 'Aguardando carrinho de reposição da tarde'
  },
  {
    id: 'aud-002',
    quarto_id: 'room-202',
    quarto_numero: '202',
    reserva_id: 'res-005',
    codigo_reserva: 'RES-9014',
    hospede_id: 'hosp-05',
    hospede_nome: 'Camila Fernandes',
    data_hora: '2026-08-24 08:45',
    responsavel_nome: 'Renata Souza (Camareira)',
    itens_consumidos: [
      {
        produto_id: 'prod-009',
        produto_nome: 'Vinho Tinto Chileno Reserva 375ml',
        quantidade: 1,
        valor_unitario: 58.00,
        subtotal: 58.00
      },
      {
        produto_id: 'prod-012',
        produto_nome: 'Castanha de Caju Torrada e Salgada 60g',
        quantidade: 1,
        valor_unitario: 16.00,
        subtotal: 16.00
      },
      {
        produto_id: 'prod-004',
        produto_nome: 'Coca-Cola Sem Açúcar Lata 350ml',
        quantidade: 1,
        valor_unitario: 9.00,
        subtotal: 9.00
      },
      {
        produto_id: 'prod-007',
        produto_nome: 'Cerveja Heineken Long Neck 330ml',
        quantidade: 2,
        valor_unitario: 15.00,
        subtotal: 30.00
      }
    ],
    valor_total_consumo: 113.00,
    lancado_na_reserva: true,
    reposicao_efetuada: false,
    observacoes: 'Auditoria de check-out final'
  }
];

export const INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES: FrigobarPreferenciaHospede[] = [
  {
    hospede_id: 'hosp-01',
    hospede_nome: 'Mariana Duarte',
    hospede_documento: '123.456.789-00',
    hospede_telefone: '(11) 98765-4321',
    itens_favoritos: ['prod-010', 'prod-004', 'prod-013'], // Chandon, Coca Zero, Milka
    restricoes_alimentares: ['zero_acucar'],
    temperatura_preferida: 'Bebidas bem geladas no compartimento superior',
    notas_vip: 'Hóspede Executiva VIP e comemorações. Não consome sucos com açúcar.',
    total_gasto_frigobar: 342.00,
    total_itens_consumidos: 14,
    ultima_compra_data: '2026-08-21'
  },
  {
    hospede_id: 'hosp-02',
    hospede_nome: 'Lucas Silveira',
    hospede_documento: '321.654.987-11',
    hospede_telefone: '(35) 99888-7766',
    itens_favoritos: ['prod-007', 'prod-008', 'prod-011', 'prod-001'], // Heineken, IPA Artesanal, Pringles, Água
    restricoes_alimentares: [],
    temperatura_preferida: 'Cervejas extras no frigobar',
    notas_vip: 'Engenheiro de empresa parceira. Sempre pede reposição de cervejas artesanais.',
    total_gasto_frigobar: 218.00,
    total_itens_consumidos: 12,
    ultima_compra_data: '2026-08-24'
  },
  {
    hospede_id: 'hosp-05',
    hospede_nome: 'Camila Fernandes',
    hospede_documento: '987.654.321-99',
    hospede_telefone: '(21) 99112-3344',
    itens_favoritos: ['prod-009', 'prod-012', 'prod-014'], // Vinho, Castanhas, Doce de Leite
    restricoes_alimentares: [],
    temperatura_preferida: 'Vinho em temperatura amena',
    notas_vip: 'Aprecia vinhos e gastronomia mineira tradicional.',
    total_gasto_frigobar: 185.00,
    total_itens_consumidos: 7,
    ultima_compra_data: '2026-08-24'
  }
];
