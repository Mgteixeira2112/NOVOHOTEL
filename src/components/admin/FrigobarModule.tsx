import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  FrigobarProduct, 
  FrigobarQuarto, 
  FrigobarMovimentacao, 
  FrigobarAuditoriaRegistro, 
  FrigobarPreferenciaHospede,
  FrigobarTemplateQuarto,
  FornecedorFrigobar
} from '../../types/frigobar';
import { 
  INITIAL_FRIGOBAR_PRODUCTS, 
  INITIAL_FRIGOBAR_QUARTOS, 
  INITIAL_FRIGOBAR_MOVIMENTACOES, 
  INITIAL_FRIGOBAR_AUDITORIAS, 
  INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES,
  INITIAL_FRIGOBAR_TEMPLATES,
  INITIAL_FRIGOBAR_FORNECEDORES
} from '../../data/mockFrigobarData';
import { FrigobarDashboardTab } from './frigobar/FrigobarDashboardTab';
import { FrigobarQuartosTab } from './frigobar/FrigobarQuartosTab';
import { FrigobarEstoqueCentralTab } from './frigobar/FrigobarEstoqueCentralTab';
import { FrigobarMovimentacoesTab } from './frigobar/FrigobarMovimentacoesTab';
import { FrigobarHospedesCrmTab } from './frigobar/FrigobarHospedesCrmTab';
import { FrigobarTemplatesTab } from './frigobar/FrigobarTemplatesTab';
import { FrigobarAuditoriaModal } from './frigobar/FrigobarAuditoriaModal';
import { FrigobarProductModal } from './frigobar/FrigobarProductModal';
import { FrigobarEntradaModal } from './frigobar/FrigobarEntradaModal';
import { FrigobarAjusteModal } from './frigobar/FrigobarAjusteModal';
import { FrigobarPreferenciaModal } from './frigobar/FrigobarPreferenciaModal';
import { 
  LayoutDashboard, 
  BedDouble, 
  Package, 
  History, 
  Heart, 
  Sliders, 
  ShoppingBag,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Hospede } from '../../types';

export type FrigobarSubTab = 
  | 'dashboard'
  | 'quartos'
  | 'estoque'
  | 'movimentacoes'
  | 'crm'
  | 'templates';

export const FrigobarModule: React.FC = () => {
  const { 
    rooms, 
    roomTypes, 
    reservations, 
    guests, 
    currentUser, 
    addConsumoToReservation 
  } = useHotel();

  const [activeSubTab, setActiveSubTab] = useState<FrigobarSubTab>('dashboard');

  // Estado dos Produtos
  const [products, setProducts] = useState<FrigobarProduct[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_FRIGOBAR_PRODUCTS_V1');
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_PRODUCTS;
    } catch {
      return INITIAL_FRIGOBAR_PRODUCTS;
    }
  });

  // Estado dos Frigobares por Quarto (Garantir que todos os quartos do hotel tenham entrada)
  const [roomMinibars, setRoomMinibars] = useState<FrigobarQuarto[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_FRIGOBAR_ROOMS_V1');
      let baseRooms: FrigobarQuarto[] = saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_QUARTOS;
      
      // Integrar com os quartos cadastrados no HotelContext se houver novos
      rooms.forEach((r) => {
        if (!baseRooms.some((b) => b.quarto_id === r.id || b.quarto_numero === r.numero)) {
          baseRooms.push({
            quarto_id: r.id,
            quarto_numero: r.numero,
            status: 'abastecido',
            itens: INITIAL_FRIGOBAR_TEMPLATES[0].itens_padrao.map((i) => ({
              produto_id: i.produto_id,
              quantidade_padrao: i.quantidade,
              quantidade_atual: i.quantidade
            }))
          });
        }
      });
      return baseRooms;
    } catch {
      return INITIAL_FRIGOBAR_QUARTOS;
    }
  });

  // Estado de Movimentações
  const [movements, setMovements] = useState<FrigobarMovimentacao[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_FRIGOBAR_MOVEMENTS_V1');
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_MOVIMENTACOES;
    } catch {
      return INITIAL_FRIGOBAR_MOVIMENTACOES;
    }
  });

  // Estado de Auditorias
  const [audits, setAudits] = useState<FrigobarAuditoriaRegistro[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_FRIGOBAR_AUDITS_V1');
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_AUDITORIAS;
    } catch {
      return INITIAL_FRIGOBAR_AUDITORIAS;
    }
  });

  // Estado de Preferências dos Hóspedes
  const [preferences, setPreferences] = useState<FrigobarPreferenciaHospede[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_FRIGOBAR_PREFERENCES_V1');
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES;
    } catch {
      return INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES;
    }
  });

  // Estado de Templates
  const [templates, setTemplates] = useState<FrigobarTemplateQuarto[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_FRIGOBAR_TEMPLATES_V1');
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_TEMPLATES;
    } catch {
      return INITIAL_FRIGOBAR_TEMPLATES;
    }
  });

  // Estado de Fornecedores
  const [suppliers] = useState<FornecedorFrigobar[]>(INITIAL_FRIGOBAR_FORNECEDORES);

  // Modais
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedRoomForAudit, setSelectedRoomForAudit] = useState<FrigobarQuarto | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<FrigobarProduct | null>(null);

  const [entradaModalOpen, setEntradaModalOpen] = useState(false);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);

  const [preferenceModalOpen, setPreferenceModalOpen] = useState(false);
  const [selectedGuestForPref, setSelectedGuestForPref] = useState<{ guest: Hospede; pref?: FrigobarPreferenciaHospede | null } | null>(null);

  // Persistência em LocalStorage
  useEffect(() => {
    localStorage.setItem('ITAJUBA_PMS_FRIGOBAR_PRODUCTS_V1', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ITAJUBA_PMS_FRIGOBAR_ROOMS_V1', JSON.stringify(roomMinibars));
  }, [roomMinibars]);

  useEffect(() => {
    localStorage.setItem('ITAJUBA_PMS_FRIGOBAR_MOVEMENTS_V1', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('ITAJUBA_PMS_FRIGOBAR_AUDITS_V1', JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    localStorage.setItem('ITAJUBA_PMS_FRIGOBAR_PREFERENCES_V1', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('ITAJUBA_PMS_FRIGOBAR_TEMPLATES_V1', JSON.stringify(templates));
  }, [templates]);

  // Ação: Confirmar Auditoria / Lançamento de Consumo de Frigobar
  const handleConfirmAudit = (auditData: {
    quarto_id: string;
    quarto_numero: string;
    itens_consumidos: Array<{
      produto_id: string;
      produto_nome: string;
      quantidade: number;
      valor_unitario: number;
      subtotal: number;
    }>;
    valor_total_consumo: number;
    lancado_na_reserva: boolean;
    reposicao_efetuada: boolean;
    observacoes?: string;
    newRoomItems: Array<{ produto_id: string; quantidade_padrao: number; quantidade_atual: number }>;
  }) => {
    const roomInfo = rooms.find((r) => r.id === auditData.quarto_id || r.numero === auditData.quarto_numero);
    const activeRes = reservations.find(
      (res) => res.quarto_id === roomInfo?.id && (res.status === 'checkin_realizado' || res.status === 'confirmada')
    );
    const guestInfo = activeRes ? guests.find((g) => g.id === activeRes.hospede_id) : undefined;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Atualizar o Quarto
    setRoomMinibars((prev) =>
      prev.map((r) => {
        if (r.quarto_id === auditData.quarto_id || r.quarto_numero === auditData.quarto_numero) {
          const hasMissing = auditData.newRoomItems.some((i) => i.quantidade_atual < i.quantidade_padrao);
          return {
            ...r,
            itens: auditData.newRoomItems,
            status: hasMissing ? 'precisa_reposicao' : 'abastecido',
            ultima_verificacao: nowStr,
            verificado_por: currentUser ? `${currentUser.nome} (${currentUser.tipo_usuario})` : 'Governança',
            observacoes: auditData.observacoes || r.observacoes
          };
        }
        return r;
      })
    );

    // 2. Lançar no Extrato da Reserva do Hóspede (HotelContext)
    if (activeRes && auditData.lancado_na_reserva && auditData.itens_consumidos.length > 0) {
      auditData.itens_consumidos.forEach((item) => {
        addConsumoToReservation(activeRes.id, {
          item: `${item.quantidade}x ${item.produto_nome} (Frigobar Q.${auditData.quarto_numero})`,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          data: nowStr.split(' ')[0]
        });
      });
    }

    // 3. Gerar Movimentações de Saída
    const newMovements: FrigobarMovimentacao[] = auditData.itens_consumidos.map((item, idx) => {
      const prod = products.find((p) => p.id === item.produto_id);
      return {
        id: `mov-${Date.now()}-${idx}`,
        data_hora: nowStr,
        tipo: 'saida_consumo_hospede',
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        valor_unitario_custo: prod?.preco_custo || 0,
        valor_unitario_venda: item.valor_unitario,
        valor_total: item.subtotal,
        quarto_id: auditData.quarto_id,
        quarto_numero: auditData.quarto_numero,
        reserva_id: activeRes?.id,
        codigo_reserva: activeRes?.codigo,
        hospede_id: guestInfo?.id,
        hospede_nome: guestInfo?.nome,
        responsavel_nome: currentUser ? `${currentUser.nome} (${currentUser.tipo_usuario})` : 'Governança',
        motivo: auditData.observacoes || 'Conferência de Frigobar no Quarto',
        observacoes: auditData.lancado_na_reserva ? 'Lançado no extrato da reserva' : 'Aferição sem débito em reserva'
      };
    });

    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
    }

    // 4. Se reposição foi efetuada, abater do Estoque Central
    if (auditData.reposicao_efetuada && auditData.itens_consumidos.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const consumedItem = auditData.itens_consumidos.find((c) => c.produto_id === p.id);
          if (consumedItem) {
            return {
              ...p,
              estoque_central: Math.max(0, p.estoque_central - consumedItem.quantidade)
            };
          }
          return p;
        })
      );
    }

    // 5. Salvar Auditoria no Histórico
    const auditRecord: FrigobarAuditoriaRegistro = {
      id: `aud-${Date.now()}`,
      quarto_id: auditData.quarto_id,
      quarto_numero: auditData.quarto_numero,
      reserva_id: activeRes?.id,
      codigo_reserva: activeRes?.codigo,
      hospede_id: guestInfo?.id,
      hospede_nome: guestInfo?.nome,
      data_hora: nowStr,
      responsavel_nome: currentUser ? currentUser.nome : 'Governança',
      itens_consumidos: auditData.itens_consumidos,
      valor_total_consumo: auditData.valor_total_consumo,
      lancado_na_reserva: auditData.lancado_na_reserva,
      reposicao_efetuada: auditData.reposicao_efetuada,
      observacoes: auditData.observacoes
    };

    setAudits((prev) => [auditRecord, ...prev]);

    // 6. Atualizar CRM do Hóspede
    if (guestInfo && auditData.valor_total_consumo > 0) {
      setPreferences((prev) => {
        const existing = prev.find((p) => p.hospede_id === guestInfo.id);
        if (existing) {
          return prev.map((p) =>
            p.hospede_id === guestInfo.id
              ? {
                  ...p,
                  total_gasto_frigobar: p.total_gasto_frigobar + auditData.valor_total_consumo,
                  total_itens_consumidos: p.total_itens_consumidos + auditData.itens_consumidos.reduce((a, b) => a + b.quantidade, 0),
                  ultima_compra_data: nowStr.split(' ')[0]
                }
              : p
          );
        } else {
          return [
            ...prev,
            {
              hospede_id: guestInfo.id,
              hospede_nome: guestInfo.nome,
              hospede_documento: guestInfo.documento,
              hospede_telefone: guestInfo.telefone,
              itens_favoritos: auditData.itens_consumidos.map((i) => i.produto_id),
              total_gasto_frigobar: auditData.valor_total_consumo,
              total_itens_consumidos: auditData.itens_consumidos.reduce((a, b) => a + b.quantidade, 0),
              ultima_compra_data: nowStr.split(' ')[0]
            }
          ];
        }
      });
    }
  };

  // Ação: Confirmar Entrada de Mercadoria / NF-e no Estoque Central
  const handleConfirmEntrada = (entradaData: {
    notaFiscal: string;
    fornecedorNome: string;
    itens: Array<{
      produtoId: string;
      produtoNome: string;
      quantidade: number;
      valorUnitarioCusto: number;
      valorTotal: number;
      lote?: string;
      validade?: string;
    }>;
    valorTotalNota: number;
    observacoes?: string;
  }) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Atualizar Produtos no Almoxarifado Central
    setProducts((prev) =>
      prev.map((p) => {
        const itemComprado = entradaData.itens.find((i) => i.produtoId === p.id);
        if (itemComprado) {
          return {
            ...p,
            estoque_central: p.estoque_central + itemComprado.quantidade,
            preco_custo: itemComprado.valorUnitarioCusto,
            lote_atual: itemComprado.lote || p.lote_atual,
            validade_proxima: itemComprado.validade || p.validade_proxima,
            fornecedor_padrao: entradaData.fornecedorNome || p.fornecedor_padrao
          };
        }
        return p;
      })
    );

    // 2. Criar Movimentações de Entrada
    const newMovements: FrigobarMovimentacao[] = entradaData.itens.map((item, idx) => {
      const prod = products.find((p) => p.id === item.produtoId);
      return {
        id: `mov-in-${Date.now()}-${idx}`,
        data_hora: nowStr,
        tipo: 'entrada_fornecedor',
        produto_id: item.produtoId,
        produto_nome: item.produtoNome,
        quantidade: item.quantidade,
        valor_unitario_custo: item.valorUnitarioCusto,
        valor_unitario_venda: prod?.preco_venda || 0,
        valor_total: item.valorTotal,
        responsavel_nome: currentUser ? currentUser.nome : 'Gerência',
        nota_fiscal: entradaData.notaFiscal,
        motivo: `Entrada Fornecedor ${entradaData.fornecedorNome}`,
        observacoes: entradaData.observacoes
      };
    });

    setMovements((prev) => [...newMovements, ...prev]);
  };

  // Ação: Registrar Ajuste / Avaria / Quebra
  const handleConfirmAjuste = (ajusteData: {
    produtoId: string;
    produtoNome: string;
    quantidade: number;
    tipo: any;
    motivo: string;
    quartoNumero?: string;
    localEstoque: 'almoxarifado' | 'quarto';
    observacoes?: string;
  }) => {
    const prod = products.find((p) => p.id === ajusteData.produtoId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Abater do estoque
    if (ajusteData.localEstoque === 'almoxarifado') {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === ajusteData.produtoId
            ? { ...p, estoque_central: Math.max(0, p.estoque_central - ajusteData.quantidade) }
            : p
        )
      );
    } else if (ajusteData.localEstoque === 'quarto' && ajusteData.quartoNumero) {
      setRoomMinibars((prev) =>
        prev.map((r) => {
          if (r.quarto_numero === ajusteData.quartoNumero) {
            return {
              ...r,
              status: 'precisa_reposicao',
              itens: r.itens.map((i) =>
                i.produto_id === ajusteData.produtoId
                  ? { ...i, quantidade_atual: Math.max(0, i.quantidade_atual - ajusteData.quantidade) }
                  : i
              )
            };
          }
          return r;
        })
      );
    }

    // Registrar Movimentação
    const newMov: FrigobarMovimentacao = {
      id: `mov-ajuste-${Date.now()}`,
      data_hora: nowStr,
      tipo: ajusteData.tipo,
      produto_id: ajusteData.produtoId,
      produto_nome: ajusteData.produtoNome,
      quantidade: ajusteData.quantidade,
      valor_unitario_custo: prod?.preco_custo || 0,
      valor_unitario_venda: prod?.preco_venda || 0,
      valor_total: ajusteData.quantidade * (prod?.preco_custo || 0),
      quarto_numero: ajusteData.quartoNumero,
      responsavel_nome: currentUser ? currentUser.nome : 'Governança',
      motivo: ajusteData.motivo,
      observacoes: ajusteData.observacoes
    };

    setMovements((prev) => [newMov, ...prev]);
  };

  // Ação: Salvar / Editar Produto
  const handleSaveProduct = (productData: Omit<FrigobarProduct, 'id'> & { id?: string }) => {
    if (productData.id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productData.id ? { ...p, ...productData } as FrigobarProduct : p))
      );
    } else {
      const newProd: FrigobarProduct = {
        ...productData,
        id: `prod-${Date.now()}`,
        estoque_alocado_quartos: 0
      } as FrigobarProduct;
      setProducts((prev) => [...prev, newProd]);
    }
  };

  // Ação: Excluir Produto
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja desativar/excluir este produto do catálogo de frigobar?')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  // Ação: Repor um quarto específico 100%
  const handleRestockSingleRoom = (quartoId: string) => {
    setRoomMinibars((prev) =>
      prev.map((r) => {
        if (r.quarto_id === quartoId) {
          return {
            ...r,
            status: 'abastecido',
            itens: r.itens.map((i) => ({
              ...i,
              quantidade_atual: i.quantidade_padrao
            })),
            ultima_verificacao: new Date().toISOString().replace('T', ' ').substring(0, 19),
            verificado_por: currentUser ? currentUser.nome : 'Governança'
          };
        }
        return r;
      })
    );
  };

  // Ação: Repor TODOS os quartos 100%
  const handleRestockAllRooms = () => {
    if (confirm('Deseja abastecer 100% todos os frigobares do hotel agora com base nos padrões estabelecidos?')) {
      setRoomMinibars((prev) =>
        prev.map((r) => ({
          ...r,
          status: 'abastecido',
          itens: r.itens.map((i) => ({
            ...i,
            quantidade_atual: i.quantidade_padrao
          })),
          ultima_verificacao: new Date().toISOString().replace('T', ' ').substring(0, 19),
          verificado_por: currentUser ? currentUser.nome : 'Governança'
        }))
      );
    }
  };

  // Ação: Salvar Preferência VIP
  const handleSavePreference = (preference: FrigobarPreferenciaHospede) => {
    setPreferences((prev) => {
      const exists = prev.some((p) => p.hospede_id === preference.hospede_id);
      if (exists) {
        return prev.map((p) => (p.hospede_id === preference.hospede_id ? preference : p));
      }
      return [...prev, preference];
    });
  };

  // Ação: Salvar Template
  const handleSaveTemplate = (template: FrigobarTemplateQuarto) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? template : t))
    );
  };

  // Ação: Aplicar Template a todos os quartos daquela categoria
  const handleApplyTemplateToAllRooms = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    if (confirm(`Deseja sincronizar o mix do padrão "${tpl.tipo_quarto_nome}" para todos os quartos correspondentes?`)) {
      setRoomMinibars((prev) =>
        prev.map((r) => {
          return {
            ...r,
            itens: tpl.itens_padrao.map((i) => ({
              produto_id: i.produto_id,
              quantidade_padrao: i.quantidade,
              quantidade_atual: i.quantidade
            })),
            status: 'abastecido'
          };
        })
      );
    }
  };

  // Abrir Modal de Auditoria para um Quarto
  const handleOpenAudit = (room: FrigobarQuarto) => {
    setSelectedRoomForAudit(room);
    setAuditModalOpen(true);
  };

  // Encontrar hóspede e reserva do quarto selecionado para auditoria
  const activeResForSelectedRoom = selectedRoomForAudit
    ? reservations.find((res) => {
        const rInfo = rooms.find((r) => r.id === selectedRoomForAudit.quarto_id || r.numero === selectedRoomForAudit.quarto_numero);
        return res.quarto_id === rInfo?.id && (res.status === 'checkin_realizado' || res.status === 'confirmada');
      })
    : undefined;

  const activeGuestForSelectedRoom = activeResForSelectedRoom
    ? guests.find((g) => g.id === activeResForSelectedRoom.hospede_id)
    : undefined;

  const totalQuartosPendentes = roomMinibars.filter((r) => r.status === 'precisa_reposicao').length;
  const totalProdutosCriticos = products.filter((p) => p.estoque_central <= p.estoque_minimo).length;

  return (
    <div className="space-y-6">
      
      {/* Menu Superior de Sub-Abas do Módulo de Frigobar */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'dashboard', label: 'Visão Geral & KPIs', icon: LayoutDashboard },
            { id: 'quartos', label: 'Frigobar por Quarto & Auditoria', icon: BedDouble, badge: totalQuartosPendentes },
            { id: 'estoque', label: 'Estoque Central & Produtos', icon: Package, badge: totalProdutosCriticos > 0 ? totalProdutosCriticos : undefined },
            { id: 'movimentacoes', label: 'Movimentações & Extrato', icon: History },
            { id: 'crm', label: 'CRM de Consumo & Hóspedes', icon: Heart },
            { id: 'templates', label: 'Padrões por Categoria', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as FrigobarSubTab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-amber-300 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{tab.label}</span>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-amber-500 text-stone-950' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Dinâmico da Sub-Aba Ativa */}
      {activeSubTab === 'dashboard' && (
        <FrigobarDashboardTab
          products={products}
          roomMinibars={roomMinibars}
          rooms={rooms}
          reservations={reservations}
          movements={movements}
          audits={audits}
          onOpenAuditModal={handleOpenAudit}
          onOpenEntradaModal={() => setEntradaModalOpen(true)}
          onOpenAjusteModal={() => setAjusteModalOpen(true)}
          onOpenNewProductModal={() => {
            setProductToEdit(null);
            setProductModalOpen(true);
          }}
          onRestockAllRooms={handleRestockAllRooms}
          onNavigateTab={(tab) => setActiveSubTab(tab as FrigobarSubTab)}
        />
      )}

      {activeSubTab === 'quartos' && (
        <FrigobarQuartosTab
          roomMinibars={roomMinibars}
          products={products}
          rooms={rooms}
          roomTypes={roomTypes}
          reservations={reservations}
          guests={guests}
          onOpenAuditModal={handleOpenAudit}
          onRestockSingleRoom={handleRestockSingleRoom}
          onRestockAllRooms={handleRestockAllRooms}
        />
      )}

      {activeSubTab === 'estoque' && (
        <FrigobarEstoqueCentralTab
          products={products}
          onOpenProductModal={(p) => {
            setProductToEdit(p || null);
            setProductModalOpen(true);
          }}
          onOpenEntradaModal={() => setEntradaModalOpen(true)}
          onOpenAjusteModal={() => setAjusteModalOpen(true)}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {activeSubTab === 'movimentacoes' && (
        <FrigobarMovimentacoesTab
          movements={movements}
        />
      )}

      {activeSubTab === 'crm' && (
        <FrigobarHospedesCrmTab
          guests={guests}
          products={products}
          preferences={preferences}
          movements={movements}
          onOpenPreferenceModal={(guest, pref) => {
            setSelectedGuestForPref({ guest, pref: pref || null });
            setPreferenceModalOpen(true);
          }}
        />
      )}

      {activeSubTab === 'templates' && (
        <FrigobarTemplatesTab
          templates={templates}
          products={products}
          roomTypes={roomTypes}
          onSaveTemplate={handleSaveTemplate}
          onApplyTemplateToAllRooms={handleApplyTemplateToAllRooms}
        />
      )}

      {/* Modais Globais */}
      {selectedRoomForAudit && (
        <FrigobarAuditoriaModal
          isOpen={auditModalOpen}
          onClose={() => {
            setAuditModalOpen(false);
            setSelectedRoomForAudit(null);
          }}
          room={selectedRoomForAudit}
          products={products}
          activeReservation={activeResForSelectedRoom}
          activeGuest={activeGuestForSelectedRoom}
          currentUserName={currentUser ? `${currentUser.nome} (${currentUser.tipo_usuario})` : 'Governança'}
          onConfirmAudit={handleConfirmAudit}
        />
      )}

      <FrigobarProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSaveProduct={handleSaveProduct}
      />

      <FrigobarEntradaModal
        isOpen={entradaModalOpen}
        onClose={() => setEntradaModalOpen(false)}
        products={products}
        suppliers={suppliers}
        currentUserName={currentUser ? currentUser.nome : 'Gerência'}
        onConfirmEntrada={handleConfirmEntrada}
      />

      <FrigobarAjusteModal
        isOpen={ajusteModalOpen}
        onClose={() => setAjusteModalOpen(false)}
        products={products}
        roomNumbers={rooms.map((r) => r.numero)}
        currentUserName={currentUser ? currentUser.nome : 'Governança'}
        onConfirmAjuste={handleConfirmAjuste}
      />

      {selectedGuestForPref && (
        <FrigobarPreferenciaModal
          isOpen={preferenceModalOpen}
          onClose={() => {
            setPreferenceModalOpen(false);
            setSelectedGuestForPref(null);
          }}
          guest={selectedGuestForPref.guest}
          existingPreference={selectedGuestForPref.pref}
          products={products}
          onSavePreference={handleSavePreference}
        />
      )}

    </div>
  );
};
