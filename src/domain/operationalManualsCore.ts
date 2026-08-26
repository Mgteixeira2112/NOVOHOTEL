/**
 * HOTEL OS — Operational Runbooks & Role Manuals Core (Phase 17 Recommendation)
 * Documentação operacional estruturada por perfil de acesso do sistema.
 */

export interface RoleManualSection {
  role: 'GERENTE' | 'RECEPCAO' | 'PDV' | 'COZINHA' | 'HOUSEKEEPING' | 'MANUTENCAO' | 'FINANCEIRO' | 'ADMINISTRADOR';
  title: string;
  badge: string;
  description: string;
  responsibilities: string[];
  standardOperatingProcedures: Array<{
    step: number;
    title: string;
    action: string;
    criticalRule: string;
  }>;
  shortcuts?: Array<{ key: string; description: string }>;
  incidentProtocols: string[];
}

export const HOTEL_OS_OPERATIONAL_MANUALS: Record<string, RoleManualSection> = {
  GERENTE: {
    role: 'GERENTE',
    title: 'Manual Operacional — Gerência Geral',
    badge: 'Estratégico / Supervisão',
    description: 'Diretrizes para supervisão executiva, aprovação de descontos extraordinários, análise de KPIs (ADR, RevPAR, GOPPAR) e gestão de contingências.',
    responsibilities: [
      'Monitorar a taxa de ocupação diária e o painel de BI em tempo real.',
      'Aprovar ou rejeitar solicitações de cancelamento fora de política e estornos superiores ao limite da recepção.',
      'Auditar o log imutável de eventos e histórico de acessos dos colaboradores.',
      'Garantir cumprimento dos SLAs de governança e manutenção.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Abertura do Dia Operacional',
        action: 'Acessar o Dashboard Executivo, verificar quartos bloqueados por manutenção e ocupação prevista para os próximos 7 dias.',
        criticalRule: 'Qualquer quarto com status OUT_OF_ORDER deve ter chamado de manutenção associado.',
      },
      {
        step: 2,
        title: 'Análise de Yield & Tarifas',
        action: 'Revisar regras de precificação dinâmica para fins de semana e feriados no Motor de Reservas.',
        criticalRule: 'Tarifas não reembolsáveis não podem ser alteradas após confirmação da reserva.',
      },
      {
        step: 3,
        title: 'Fechamento & Auditoria Noturna',
        action: 'Conferir relatório consolidado de folios pendentes e divergências de estoque de frigobar/PDV.',
        criticalRule: 'Auditar se todos os check-outs previstos foram devidamente baixados no sistema.',
      },
    ],
    incidentProtocols: [
      'Em caso de Overbooking acidental: Ativar imediatamente a política de reacomodação (walk) em hotel parceiro credenciado com upgrade de cortesia.',
      'Em caso de incidente grave em quarto: Acionar bloqueio de segurança imediato no sistema e abrir chamado prioritário para gerência de risco.',
    ],
  },
  RECEPCAO: {
    role: 'RECEPCAO',
    title: 'Manual Operacional — Recepção & Front Desk',
    badge: 'Atendimento & Check-in',
    description: 'Procedimentos de check-in, check-out, validação cadastral, entrega de chaves/QR Code, lançamento em conta de hospedagem e acolhimento do hóspede.',
    responsibilities: [
      'Realizar o check-in em menos de 2 minutos utilizando busca rápida por nome, CPF ou localizador.',
      'Garantir a verificação documental e vinculação correta do hóspede ao quarto físico.',
      'Efetuar lançamentos no Folio e receber pagamentos na liquidação de estadias.',
      'Notificar Governança sobre check-outs imediatos para liberação rápida de quartos.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Check-in Ágil',
        action: 'Localizar a reserva no painel de Chegadas, conferir documento do titular, registrar número de acompanhantes e emitir chave/QR de acesso.',
        criticalRule: 'Nunca entregar chave para quarto que não esteja com status CLEAN e INSPECTED.',
      },
      {
        step: 2,
        title: 'Lançamento de Consumos no Folio',
        action: 'Ao receber solicitações de consumo ou serviços, debitar no Folio da estadia selecionando o quarto correto.',
        criticalRule: 'Confirmar sempre o nome do titular do quarto antes de lançar o débito.',
      },
      {
        step: 3,
        title: 'Check-out & Fechamento de Conta',
        action: 'Revisar itens de frigobar e pedidos de room service com o hóspede, processar pagamento (Cartão/PIX/Dinheiro) e emitir recibo fiscal.',
        criticalRule: 'Ao finalizar o check-out, o sistema automaticamente move o quarto para DIRTY e higieniza a sessão do tablet.',
      },
    ],
    shortcuts: [
      { key: 'F2', description: 'Busca rápida de reservas' },
      { key: 'F8', description: 'Finalizar check-in/check-out' },
    ],
    incidentProtocols: [
      'Hóspede contesta lançamento de frigobar: Solicitar verificação imediata da governança antes de estornar o item.',
      'Queda de conexão externa: Continuar operando através do modo Offline seguro, lançando as estadias na fila local.',
    ],
  },
  PDV: {
    role: 'PDV',
    title: 'Manual Operacional — Pontos de Venda (PDV & Restaurante)',
    badge: 'Vendas & Comandas',
    description: 'Instruções para operadores de caixa de restaurantes, bares, lojas e room service no HOTEL OS.',
    responsibilities: [
      'Lançar pedidos com rapidez utilizando teclado (F2, F4, F8, ESC) ou tela touch.',
      'Vincular comandas a mesas físicas ou diretamente à conta do quarto do hóspede.',
      'Emitir comandas de produção diretamente para a impressora ou tela da cozinha (KDS).',
      'Efetuar fechamento e conferência diária do caixa do turno.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Abertura do Caixa de Turno',
        action: 'Informar fundo de caixa inicial e selecionar o terminal registrado do respectivo ponto de venda.',
        criticalRule: 'Não operar com o terminal de outro departamento ou caixa.',
      },
      {
        step: 2,
        title: 'Lançamento de Comanda',
        action: 'Digitar produto ou ler via código de barras, ajustar quantidade e observações (ex: "sem cebola"), selecionar mesa ou quarto.',
        criticalRule: 'Lançamentos para quarto exigem confirmação do nome do hóspede cadastrado na estadia.',
      },
      {
        step: 3,
        title: 'Aplicação de Desconto',
        action: 'Pressionar F4 e informar percentual ou valor; se superior a 10%, solicitar credencial de supervisor.',
        criticalRule: 'Todo desconto é gravado no log de auditoria com identificação do autorizador.',
      },
    ],
    shortcuts: [
      { key: 'F2', description: 'Pesquisa instantânea de produtos' },
      { key: 'F4', description: 'Solicitar desconto com PIN' },
      { key: 'F8', description: 'Finalizar comanda / pagamento' },
      { key: 'ESC', description: 'Cancelar item / operação atual' },
    ],
    incidentProtocols: [
      'Impressora de cupom travada: Os pedidos continuam visíveis em tempo real na tela KDS da cozinha.',
      'Tentativa de venda offline: Permitida para pedidos internos; cobranças com cartão devem ocorrer via maquininha física homologada.',
    ],
  },
  COZINHA: {
    role: 'COZINHA',
    title: 'Manual Operacional — Cozinha & KDS (Kitchen Display)',
    badge: 'Produção & SLA',
    description: 'Diretrizes para equipe gastronômica no controle de tempo de preparo e expedição de pratos.',
    responsibilities: [
      'Acompanhar a fila de pedidos recebidos em tempo real na tela KDS.',
      'Marcar início de preparo e conclusão dos pratos.',
      'Sinalizar itens esgotados para bloqueio imediato nos terminais de PDV e tablets dos quartos.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Recepção de Pedido',
        action: 'Tocar no card do pedido na coluna "Novos Pedidos" para mudar status para "Em Preparo".',
        criticalRule: 'Pedidos com observação de alergia alimentar possuem destaque visual em vermelho obrigatório.',
      },
      {
        step: 2,
        title: 'Expedição do Prato',
        action: 'Ao finalizar o prato, tocar em "Pronto para Entrega", acionando o garçom ou mensageiro de Room Service.',
        criticalRule: 'O tempo total de preparo é computado no SLA da cozinha do painel gerencial.',
      },
    ],
    incidentProtocols: [
      'Atraso crítico de preparo (> 25 min): O sistema emite alerta sonoro e visual destacando a comanda.',
    ],
  },
  HOUSEKEEPING: {
    role: 'HOUSEKEEPING',
    title: 'Manual Operacional — Governança & Housekeeping',
    badge: 'Limpeza & Higienização',
    description: 'Fluxo para camareiras e supervisores de governança na gestão do ciclo de limpeza dos quartos.',
    responsibilities: [
      'Executar limpezas de checkout, stayover (estadia) e vistorias de inspeção.',
      'Registrar consumo de frigobar durante a limpeza do quarto.',
      'Apontar avarias encontradas abrindo chamado com foto para manutenção.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Iniciar Limpeza do Quarto',
        action: 'No tablet ou smartphone, abrir o quarto com status DIRTY e tocar em "Iniciar Limpeza" (move para CLEANING).',
        criticalRule: 'Se houver aviso de "Não Perturbe" (DND) ativo pelo hóspede, não entrar e sinalizar no app.',
      },
      {
        step: 2,
        title: 'Conferência de Frigobar',
        action: 'Digitar a quantidade de itens consumidos diretamente no aplicativo; os débitos caem instantaneamente no Folio da estadia.',
        criticalRule: 'Conferir o lacre dos itens antes de marcar como intacto.',
      },
      {
        step: 3,
        title: 'Conclusão e Inspeção',
        action: 'Finalizar limpeza (status CLEAN) e aguardar aprovação da governanta chefe para liberação (status AVAILABLE).',
        criticalRule: 'Quarto só pode receber novo check-in após ser liberado pela supervisão.',
      },
    ],
    incidentProtocols: [
      'Item esquecido por hóspede anterior: Cadastrar imediatamente no módulo de "Achados & Perdidos" com foto do item e número do quarto.',
    ],
  },
  MANUTENCAO: {
    role: 'MANUTENCAO',
    title: 'Manual Operacional — Manutenção & Engenharia',
    badge: 'Ativos & Reparos',
    description: 'Procedimentos para abertura, triagem, execução e encerramento de ordens de serviço de manutenção predial e preventiva.',
    responsibilities: [
      'Atender chamados corretivos e preventivos em quartos, áreas comuns e maquinários.',
      'Bloquear quartos indisponíveis (OUT_OF_ORDER) para impedir venda no motor de reservas.',
      'Registrar custos de peças e tempo de reparo (MTTR) para controle de ativos.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Abertura de Chamado',
        action: 'Selecionar o quarto ou área, categoria da falha (Elétrica, Hidráulica, Ar Condicionado), fotografar o problema e salvar.',
        criticalRule: 'Se o reparo exigir interdição do quarto, o sistema aciona bloqueio imediato na grade de reservas.',
      },
      {
        step: 2,
        title: 'Execução do Reparo',
        action: 'Iniciar a tarefa no Kanban de Manutenção e registrar peças utilizadas do estoque.',
        criticalRule: 'Sempre testar o funcionamento do equipamento antes de declarar concluído.',
      },
      {
        step: 3,
        title: 'Liberação do Quarto',
        action: 'Concluir o chamado e encaminhar o quarto para limpeza de higienização prévia à liberação.',
        criticalRule: 'Nenhum quarto sai de manutenção direto para venda sem passar pela limpeza de governança.',
      },
    ],
    incidentProtocols: [
      'Vazamento hidráulico urgente: Fechar registro geral do andar e notificar a recepção imediatamente.',
    ],
  },
  FINANCEIRO: {
    role: 'FINANCEIRO',
    title: 'Manual Operacional — Controladoria & Financeiro',
    badge: 'Contas & Auditoria',
    description: 'Instruções para fechamento contábil, contas a pagar/receber, conciliação bancária de cartões/PIX e DRE.',
    responsibilities: [
      'Auditar fechamento de faturamento e reconciliação dos Folios.',
      'Gerenciar contas a pagar (fornecedores, manutenção) e contas a receber (faturamento corporativo).',
      'Exportar relatórios gerenciais e fiscais nos formatos PDF, CSV e XLSX.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Reconciliação Diária de Recebíveis',
        action: 'Confrontar os extratos das adquirentes e PIX com as liquidações registradas no sistema HOTEL OS.',
        criticalRule: 'Divergências acima de R$ 0,00 devem ser apuradas antes do fechamento do lote fiscal.',
      },
      {
        step: 2,
        title: 'Controle de Faturamento Corporativo',
        action: 'Emitir faturas agrupadas para empresas conveniadas com prazo de vencimento a 15/30 dias.',
        criticalRule: 'Bloquear novos faturamentos para clientes com títulos em atraso > 5 dias.',
      },
    ],
    incidentProtocols: [
      'Chargeback notificado por operadora: Extrair imediatamente o log de auditoria, comprovante de check-in e assinatura do voucher.',
    ],
  },
  ADMINISTRADOR: {
    role: 'ADMINISTRADOR',
    title: 'Manual Operacional — Administração do Sistema & TI',
    badge: 'Root / Multi-Tenant',
    description: 'Gestão de usuários, permissões RBAC, isolamento multi-tenant, chaves de API, monitoramento de saúde do sistema e contingência de desastres.',
    responsibilities: [
      'Gerenciar hotéis da rede, permissões de usuários e limites de cota da organização.',
      'Auditar integridade de dados e conformidade das políticas RLS no Supabase.',
      'Executar testes periódicos de restauração de backup (RPO $\le$ 5m, RTO $\le$ 15m).',
      'Revogar remotamente credenciais de terminais e dispositivos extraviados.',
    ],
    standardOperatingProcedures: [
      {
        step: 1,
        title: 'Gestão de Acessos & RBAC',
        action: 'Cadastrar novos usuários e associar estritamente aos hotéis e papéis devidos (ex: PDV_ONLY, RECEPCAO, GERENTE).',
        criticalRule: 'Nunca conceder perfil SUPER_ADMIN ou ADMIN sem justificativa de governança.',
      },
      {
        step: 2,
        title: 'Monitoramento & APM',
        action: 'Acompanhar latência das consultas, integridade de conexões realtime e fila de eventos no painel de observabilidade.',
        criticalRule: 'Taxa de erro da API não deve ultrapassar 0.1% em produção.',
      },
      {
        step: 3,
        title: 'Revogação de Dispositivos',
        action: 'Em caso de perda ou furto de tablet do quarto ou terminal POS, acionar o botão "Revoke" no registro de dispositivos.',
        criticalRule: 'O terminal revogado é desconectado instantaneamente e tem todos os dados locais expurgados.',
      },
    ],
    incidentProtocols: [
      'Falha geral de infraestrutura: Ativar plano de contingência RTO (recuperação em menos de 15 minutos via réplica ativa).',
    ],
  },
};

export function getOperationalManualByRole(role: string): RoleManualSection {
  const normRole = (role || '').toUpperCase().trim();
  return HOTEL_OS_OPERATIONAL_MANUALS[normRole] || HOTEL_OS_OPERATIONAL_MANUALS.RECEPCAO;
}
