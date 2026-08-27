import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  FrigobarProduct, 
  FrigobarQuarto, 
  FrigobarMovimentacao, 
  FrigobarAuditoriaRegistro, 
  FrigobarPreferenciaHospede,
  FrigobarTemplateQuarto,
  FornecedorFrigobar,
  RoomFrigobarStatus,
  TipoMovimentacaoEstoque
} from '../types/frigobar';
import { 
  INITIAL_FRIGOBAR_PRODUCTS, 
  INITIAL_FRIGOBAR_QUARTOS, 
  INITIAL_FRIGOBAR_MOVIMENTACOES, 
  INITIAL_FRIGOBAR_AUDITORIAS, 
  INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES,
  INITIAL_FRIGOBAR_TEMPLATES,
  INITIAL_FRIGOBAR_FORNECEDORES
} from '../data/mockFrigobarData';
import { useHotel } from './HotelContext';
import { kanbanV2 } from '../services/kanbanV2';

export interface MinibarItemSummary {
  product: FrigobarProduct;
  current: number;
  target: number;
  missing: number;
}

export interface MinibarRoomSummary {
  quartoId: string;
  quartoNumero: string;
  status: RoomFrigobarStatus;
  totalItemsTarget: number;
  totalItemsCurrent: number;
  percentage: number;
  missingCount: number;
  missingList: MinibarItemSummary[];
  itemsList: MinibarItemSummary[];
  totalValueAtCost: number;
  totalValueAtSell: number;
  isFullyStocked: boolean;
  needsRestock: boolean;
}

interface FrigobarContextType {
  products: FrigobarProduct[];
  roomMinibars: FrigobarQuarto[];
  movements: FrigobarMovimentacao[];
  audits: FrigobarAuditoriaRegistro[];
  preferences: FrigobarPreferenciaHospede[];
  templates: FrigobarTemplateQuarto[];
  suppliers: FornecedorFrigobar[];

  // Consultas e Resumos
  getRoomMinibar: (roomIdOrNum: string) => FrigobarQuarto | undefined;
  getRoomMinibarSummary: (roomIdOrNum: string) => MinibarRoomSummary;
  getProductById: (id: string) => FrigobarProduct | undefined;
  getGuestPreference: (guestId: string) => FrigobarPreferenciaHospede | undefined;

  // Ações de Operação no Quarto
  quickRestockRoom: (roomIdOrNum: string, userName?: string) => { success: boolean; message: string; count: number };
  quickConsumeItem: (
    roomIdOrNum: string, 
    productId: string, 
    quantity: number, 
    reservationId?: string, 
    guestId?: string, 
    userName?: string
  ) => { success: boolean; message: string; subtotal: number };
  
  auditRoomMinibar: (auditData: {
    quarto_id: string;
    quarto_numero: string;
    reserva_id?: string;
    codigo_reserva?: string;
    hospede_id?: string;
    hospede_nome?: string;
    responsavel_nome: string;
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
  }) => void;

  reabastecerTodosQuartos: (userName?: string) => { success: boolean; totalReposto: number };

  // Ações de Almoxarifado e Gestão
  saveProduct: (product: FrigobarProduct) => void;
  deleteProduct: (productId: string) => void;
  darEntradaEstoque: (
    productId: string, 
    quantity: number, 
    custoUnitario: number, 
    notaFiscal: string, 
    fornecedorNome: string, 
    userName: string
  ) => void;
  darBaixaAjuste: (
    productId: string, 
    quantity: number, 
    tipo: TipoMovimentacaoEstoque, 
    motivo: string, 
    userName: string, 
    quartoNumero?: string
  ) => void;
  saveTemplate: (template: FrigobarTemplateQuarto) => void;
  saveGuestPreference: (pref: FrigobarPreferenciaHospede) => void;
  resetFrigobarData: () => void;
}

const FrigobarContext = createContext<FrigobarContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'ITAJUBA_PMS_FRIGOBAR_PRODUCTS_V1',
  ROOMS: 'ITAJUBA_PMS_FRIGOBAR_ROOMS_V1',
  MOVEMENTS: 'ITAJUBA_PMS_FRIGOBAR_MOVEMENTS_V1',
  AUDITS: 'ITAJUBA_PMS_FRIGOBAR_AUDITS_V1',
  PREFERENCES: 'ITAJUBA_PMS_FRIGOBAR_PREFERENCES_V1',
  TEMPLATES: 'ITAJUBA_PMS_FRIGOBAR_TEMPLATES_V1'
};

export const FrigobarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { rooms, currentUser, addConsumoToReservation } = useHotel();

  // Produtos
  const [products, setProducts] = useState<FrigobarProduct[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_PRODUCTS;
    } catch {
      return INITIAL_FRIGOBAR_PRODUCTS;
    }
  });

  // Frigobares por Quarto
  const [roomMinibars, setRoomMinibars] = useState<FrigobarQuarto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
      let base: FrigobarQuarto[] = saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_QUARTOS;
      return base;
    } catch {
      return INITIAL_FRIGOBAR_QUARTOS;
    }
  });

  // Movimentações
  const [movements, setMovements] = useState<FrigobarMovimentacao[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_MOVIMENTACOES;
    } catch {
      return INITIAL_FRIGOBAR_MOVIMENTACOES;
    }
  });

  // Auditorias
  const [audits, setAudits] = useState<FrigobarAuditoriaRegistro[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDITS);
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_AUDITORIAS;
    } catch {
      return INITIAL_FRIGOBAR_AUDITORIAS;
    }
  });

  // Preferências
  const [preferences, setPreferences] = useState<FrigobarPreferenciaHospede[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES;
    } catch {
      return INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES;
    }
  });

  // Templates
  const [templates, setTemplates] = useState<FrigobarTemplateQuarto[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return saved ? JSON.parse(saved) : INITIAL_FRIGOBAR_TEMPLATES;
    } catch {
      return INITIAL_FRIGOBAR_TEMPLATES;
    }
  });

  // Fornecedores
  const [suppliers] = useState<FornecedorFrigobar[]>(INITIAL_FRIGOBAR_FORNECEDORES);

  // Persistência
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(roomMinibars));
    } catch {}
  }, [roomMinibars]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch {}
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
    } catch {}
  }, [audits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch {}
  }, [templates]);

  // Garantir que todos os quartos do Hotel tenham um frigobar configurado
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      setRoomMinibars((prev) => {
        let changed = false;
        const copy = [...prev];
        rooms.forEach((r) => {
          const exists = copy.some((m) => m.quarto_id === r.id || m.quarto_numero === r.numero);
          if (!exists) {
            changed = true;
            copy.push({
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
        return changed ? copy : prev;
      });
    }
  }, [rooms]);

  // Helpers
  const getProductById = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  const getGuestPreference = useCallback((guestId: string) => {
    return preferences.find((p) => p.hospede_id === guestId);
  }, [preferences]);

  const getRoomMinibar = useCallback((roomIdOrNum: string) => {
    return roomMinibars.find((r) => r.quarto_id === roomIdOrNum || r.quarto_numero === roomIdOrNum);
  }, [roomMinibars]);

  // Resumo de Frigobar de um Quarto
  const getRoomMinibarSummary = useCallback((roomIdOrNum: string): MinibarRoomSummary => {
    const minibar = roomMinibars.find((r) => r.quarto_id === roomIdOrNum || r.quarto_numero === roomIdOrNum);
    
    if (!minibar) {
      return {
        quartoId: roomIdOrNum,
        quartoNumero: roomIdOrNum,
        status: 'abastecido',
        totalItemsTarget: 0,
        totalItemsCurrent: 0,
        percentage: 100,
        missingCount: 0,
        missingList: [],
        itemsList: [],
        totalValueAtCost: 0,
        totalValueAtSell: 0,
        isFullyStocked: true,
        needsRestock: false
      };
    }

    let targetTotal = 0;
    let currentTotal = 0;
    let valueCost = 0;
    let valueSell = 0;
    const itemsList: MinibarItemSummary[] = [];
    const missingList: MinibarItemSummary[] = [];

    (minibar.itens || []).forEach((item) => {
      const prod = products.find((p) => p.id === item.produto_id) || {
        id: item.produto_id,
        codigo: 'SKU',
        nome: 'Produto',
        categoria: 'bebidas_nao_alcoolicas' as const,
        preco_custo: 0,
        preco_venda: 0,
        estoque_central: 0,
        estoque_alocado_quartos: 0,
        estoque_minimo: 0,
        estoque_maximo: 0,
        unidade: 'un' as const,
        ativo: true
      };

      const target = item.quantidade_padrao || 0;
      const current = item.quantidade_atual || 0;
      const missing = Math.max(0, target - current);

      targetTotal += target;
      currentTotal += current;
      valueCost += current * prod.preco_custo;
      valueSell += current * prod.preco_venda;

      const summaryItem: MinibarItemSummary = {
        product: prod,
        current,
        target,
        missing
      };

      itemsList.push(summaryItem);
      if (missing > 0) {
        missingList.push(summaryItem);
      }
    });

    const percentage = targetTotal > 0 ? Math.round((currentTotal / targetTotal) * 100) : 100;
    const isFullyStocked = missingList.length === 0;
    const needsRestock = missingList.length > 0;

    let computedStatus: RoomFrigobarStatus = minibar.status;
    if (isFullyStocked) {
      computedStatus = 'abastecido';
    } else if (currentTotal === 0 && targetTotal > 0) {
      computedStatus = 'critico_vazio';
    } else {
      computedStatus = 'precisa_reposicao';
    }

    return {
      quartoId: minibar.quarto_id,
      quartoNumero: minibar.quarto_numero,
      status: computedStatus,
      totalItemsTarget: targetTotal,
      totalItemsCurrent: currentTotal,
      percentage,
      missingCount: missingList.reduce((acc, i) => acc + i.missing, 0),
      missingList,
      itemsList,
      totalValueAtCost: valueCost,
      totalValueAtSell: valueSell,
      isFullyStocked,
      needsRestock
    };
  }, [roomMinibars, products]);

  // Reposição Rápida de Quarto
  const quickRestockRoom = useCallback((roomIdOrNum: string, userName?: string) => {
    const minibar = roomMinibars.find((r) => r.quarto_id === roomIdOrNum || r.quarto_numero === roomIdOrNum);
    if (!minibar) {
      return { success: false, message: 'Frigobar do quarto não encontrado.', count: 0 };
    }

    const respName = userName || currentUser?.nome || 'Governança';
    const nowIso = new Date().toISOString();
    let countRestocked = 0;
    const newMovements: FrigobarMovimentacao[] = [];

    // Atualiza itens do quarto
    const updatedItens = minibar.itens.map((item) => {
      const missing = item.quantidade_padrao - item.quantidade_atual;
      if (missing > 0) {
        const prod = products.find((p) => p.id === item.produto_id);
        const qtyToTransfer = prod ? Math.min(missing, prod.estoque_central) : missing;

        if (qtyToTransfer > 0) {
          countRestocked += qtyToTransfer;
          newMovements.push({
            id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            data_hora: nowIso,
            tipo: 'transferencia_reposicao',
            produto_id: item.produto_id,
            produto_nome: prod?.nome || 'Item Frigobar',
            quantidade: qtyToTransfer,
            valor_unitario_custo: prod?.preco_custo || 0,
            valor_unitario_venda: prod?.preco_venda || 0,
            valor_total: (prod?.preco_venda || 0) * qtyToTransfer,
            quarto_id: minibar.quarto_id,
            quarto_numero: minibar.quarto_numero,
            responsavel_nome: respName,
            motivo: `Reposição padrão do quarto ${minibar.quarto_numero}`
          });

          return {
            ...item,
            quantidade_atual: item.quantidade_atual + qtyToTransfer,
            ultima_auditoria: nowIso
          };
        }
      }
      return item;
    });

    // Atualiza estado do frigobar
    setRoomMinibars((prev) =>
      prev.map((r) => {
        if (r.quarto_id === minibar.quarto_id || r.quarto_numero === minibar.quarto_numero) {
          return {
            ...r,
            status: 'abastecido',
            itens: updatedItens,
            ultima_verificacao: nowIso,
            verificado_por: respName
          };
        }
        return r;
      })
    );

    // Deduz do estoque central
    setProducts((prev) =>
      prev.map((p) => {
        const mov = newMovements.find((m) => m.produto_id === p.id);
        if (mov) {
          return {
            ...p,
            estoque_central: Math.max(0, p.estoque_central - mov.quantidade),
            estoque_alocado_quartos: p.estoque_alocado_quartos + mov.quantidade
          };
        }
        return p;
      })
    );

    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
    }

    kanbanV2.syncMinibar(minibar.quarto_numero, false).catch(() => {});

    return {
      success: true,
      message: `Frigobar do Quarto ${minibar.quarto_numero} abastecido com sucesso! (${countRestocked} itens repostos).`,
      count: countRestocked
    };
  }, [roomMinibars, products, currentUser]);

  // Consumo Rápido de 1 Item
  const quickConsumeItem = useCallback((
    roomIdOrNum: string, 
    productId: string, 
    quantity: number, 
    reservationId?: string, 
    guestId?: string, 
    userName?: string
  ) => {
    const minibar = roomMinibars.find((r) => r.quarto_id === roomIdOrNum || r.quarto_numero === roomIdOrNum);
    const prod = products.find((p) => p.id === productId);

    if (!minibar || !prod) {
      return { success: false, message: 'Quarto ou produto inválido.', subtotal: 0 };
    }

    const respName = userName || currentUser?.nome || 'Recepção / Governança';
    const nowIso = new Date().toISOString();
    const subtotal = prod.preco_venda * quantity;

    // Atualiza o quarto
    setRoomMinibars((prev) =>
      prev.map((r) => {
        if (r.quarto_id === minibar.quarto_id || r.quarto_numero === minibar.quarto_numero) {
          const updatedItens = r.itens.map((item) => {
            if (item.produto_id === productId) {
              return {
                ...item,
                quantidade_atual: Math.max(0, item.quantidade_atual - quantity),
                ultima_auditoria: nowIso
              };
            }
            return item;
          });
          return {
            ...r,
            itens: updatedItens,
            status: 'precisa_reposicao',
            ultima_verificacao: nowIso,
            verificado_por: respName
          };
        }
        return r;
      })
    );

    // Registra movimentação
    const movement: FrigobarMovimentacao = {
      id: `mov-${Date.now()}`,
      data_hora: nowIso,
      tipo: 'saida_consumo_hospede',
      produto_id: prod.id,
      produto_nome: prod.nome,
      quantidade: quantity,
      valor_unitario_custo: prod.preco_custo,
      valor_unitario_venda: prod.preco_venda,
      valor_total: subtotal,
      quarto_id: minibar.quarto_id,
      quarto_numero: minibar.quarto_numero,
      reserva_id: reservationId,
      hospede_id: guestId,
      responsavel_nome: respName,
      motivo: `Consumo Quarto ${minibar.quarto_numero}`
    };

    setMovements((prev) => [movement, ...prev]);

    // Atualiza estoque alocado nos quartos
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            estoque_alocado_quartos: Math.max(0, p.estoque_alocado_quartos - quantity)
          };
        }
        return p;
      })
    );

    // Se tiver reserva vinculada, lança na reserva
    if (reservationId && addConsumoToReservation) {
      addConsumoToReservation(reservationId, {
        item: `Frigobar: ${prod.nome}`,
        quantidade: quantity,
        valor_unitario: prod.preco_venda,
        data: nowIso.split('T')[0]
      });
    }

    return {
      success: true,
      message: `${quantity}x ${prod.nome} lançado(s) no Quarto ${minibar.quarto_numero} (R$ ${subtotal.toFixed(2)}).`,
      subtotal
    };
  }, [roomMinibars, products, currentUser, addConsumoToReservation]);

  // Auditoria Completa
  const auditRoomMinibar = useCallback((auditData: {
    quarto_id: string;
    quarto_numero: string;
    reserva_id?: string;
    codigo_reserva?: string;
    hospede_id?: string;
    hospede_nome?: string;
    responsavel_nome: string;
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
  }) => {
    const nowIso = new Date().toISOString();
    const newAudit: FrigobarAuditoriaRegistro = {
      ...auditData,
      id: `aud-${Date.now()}`,
      data_hora: nowIso
    };

    setAudits((prev) => [newAudit, ...prev]);

    // Cria movimentações de saída para cada item consumido
    const newMovements: FrigobarMovimentacao[] = auditData.itens_consumidos.map((item) => {
      const prod = products.find((p) => p.id === item.produto_id);
      return {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        data_hora: nowIso,
        tipo: 'saida_consumo_hospede',
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: item.quantidade,
        valor_unitario_custo: prod?.preco_custo || 0,
        valor_unitario_venda: item.valor_unitario,
        valor_total: item.subtotal,
        quarto_id: auditData.quarto_id,
        quarto_numero: auditData.quarto_numero,
        reserva_id: auditData.reserva_id,
        codigo_reserva: auditData.codigo_reserva,
        hospede_id: auditData.hospede_id,
        hospede_nome: auditData.hospede_nome,
        responsavel_nome: auditData.responsavel_nome,
        motivo: `Auditoria de Frigobar Quarto ${auditData.quarto_numero}`
      };
    });

    if (newMovements.length > 0) {
      setMovements((prev) => [...newMovements, ...prev]);
    }

    // Se lançado na reserva, adiciona
    if (auditData.reserva_id && auditData.lancado_na_reserva && addConsumoToReservation) {
      auditData.itens_consumidos.forEach((item) => {
        addConsumoToReservation(auditData.reserva_id!, {
          item: `Frigobar: ${item.produto_nome}`,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          data: nowIso.split('T')[0]
        });
      });
    }

    // Atualiza o frigobar do quarto
    setRoomMinibars((prev) =>
      prev.map((r) => {
        if (r.quarto_id === auditData.quarto_id || r.quarto_numero === auditData.quarto_numero) {
          if (auditData.reposicao_efetuada) {
            return {
              ...r,
              status: 'abastecido',
              itens: r.itens.map((i) => ({ ...i, quantidade_atual: i.quantidade_padrao, ultima_auditoria: nowIso })),
              ultima_verificacao: nowIso,
              verificado_por: auditData.responsavel_nome,
              observacoes: auditData.observacoes
            };
          } else {
            return {
              ...r,
              status: auditData.itens_consumidos.length > 0 ? 'precisa_reposicao' : 'abastecido',
              ultima_verificacao: nowIso,
              verificado_por: auditData.responsavel_nome,
              observacoes: auditData.observacoes
            };
          }
        }
        return r;
      })
    );

    const needsRestock = !auditData.reposicao_efetuada && auditData.itens_consumidos.length > 0;
    const missingSummary = needsRestock 
      ? `Itens consumidos: ${auditData.itens_consumidos.map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ')}`
      : undefined;
    kanbanV2.syncMinibar(auditData.quarto_numero, needsRestock, missingSummary).catch(() => {});
  }, [products, addConsumoToReservation]);

  // Reabastecer Todos os Quartos
  const reabastecerTodosQuartos = useCallback((userName?: string) => {
    const respName = userName || currentUser?.nome || 'Governança';
    const nowIso = new Date().toISOString();
    let totalReposto = 0;

    setRoomMinibars((prev) =>
      prev.map((r) => {
        const newItens = r.itens.map((i) => {
          const diff = i.quantidade_padrao - i.quantidade_atual;
          if (diff > 0) totalReposto += diff;
          return {
            ...i,
            quantidade_atual: i.quantidade_padrao,
            ultima_auditoria: nowIso
          };
        });
        return {
          ...r,
          status: 'abastecido',
          itens: newItens,
          ultima_verificacao: nowIso,
          verificado_por: respName
        };
      })
    );

    return {
      success: true,
      totalReposto
    };
  }, [currentUser]);

  // Salvar Produto
  const saveProduct = useCallback((product: FrigobarProduct) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => (p.id === product.id ? product : p));
      }
      return [...prev, product];
    });
  }, []);

  // Deletar Produto
  const deleteProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  // Entrada de Almoxarifado
  const darEntradaEstoque = useCallback((
    productId: string, 
    quantity: number, 
    custoUnitario: number, 
    notaFiscal: string, 
    fornecedorNome: string, 
    userName: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const nowIso = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            preco_custo: custoUnitario,
            estoque_central: p.estoque_central + quantity,
            fornecedor_padrao: fornecedorNome || p.fornecedor_padrao
          };
        }
        return p;
      })
    );

    const mov: FrigobarMovimentacao = {
      id: `mov-${Date.now()}`,
      data_hora: nowIso,
      tipo: 'entrada_fornecedor',
      produto_id: prod.id,
      produto_nome: prod.nome,
      quantidade: quantity,
      valor_unitario_custo: custoUnitario,
      valor_unitario_venda: prod.preco_venda,
      valor_total: custoUnitario * quantity,
      responsavel_nome: userName || currentUser?.nome || 'Almoxarifado',
      nota_fiscal: notaFiscal,
      motivo: `Entrada NF ${notaFiscal} - ${fornecedorNome}`
    };

    setMovements((prev) => [mov, ...prev]);
  }, [products, currentUser]);

  // Baixa / Ajuste
  const darBaixaAjuste = useCallback((
    productId: string, 
    quantity: number, 
    tipo: TipoMovimentacaoEstoque, 
    motivo: string, 
    userName: string, 
    quartoNumero?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const nowIso = new Date().toISOString();

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            estoque_central: Math.max(0, p.estoque_central - quantity)
          };
        }
        return p;
      })
    );

    const mov: FrigobarMovimentacao = {
      id: `mov-${Date.now()}`,
      data_hora: nowIso,
      tipo,
      produto_id: prod.id,
      produto_nome: prod.nome,
      quantidade: quantity,
      valor_unitario_custo: prod.preco_custo,
      valor_unitario_venda: prod.preco_venda,
      valor_total: prod.preco_custo * quantity,
      quarto_numero: quartoNumero,
      responsavel_nome: userName || currentUser?.nome || 'Almoxarifado',
      motivo
    };

    setMovements((prev) => [mov, ...prev]);
  }, [products, currentUser]);

  // Salvar Template
  const saveTemplate = useCallback((template: FrigobarTemplateQuarto) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === template.id);
      if (exists) {
        return prev.map((t) => (t.id === template.id ? template : t));
      }
      return [...prev, template];
    });
  }, []);

  // Salvar Preferência de Hóspede
  const saveGuestPreference = useCallback((pref: FrigobarPreferenciaHospede) => {
    setPreferences((prev) => {
      const exists = prev.some((p) => p.hospede_id === pref.hospede_id);
      if (exists) {
        return prev.map((p) => (p.hospede_id === pref.hospede_id ? pref : p));
      }
      return [...prev, pref];
    });
  }, []);

  // Resetar Base
  const resetFrigobarData = useCallback(() => {
    setProducts(INITIAL_FRIGOBAR_PRODUCTS);
    setRoomMinibars(INITIAL_FRIGOBAR_QUARTOS);
    setMovements(INITIAL_FRIGOBAR_MOVIMENTACOES);
    setAudits(INITIAL_FRIGOBAR_AUDITORIAS);
    setPreferences(INITIAL_FRIGOBAR_PREFERENCIAS_HOSPEDES);
    setTemplates(INITIAL_FRIGOBAR_TEMPLATES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  }, []);

  return (
    <FrigobarContext.Provider
      value={{
        products,
        roomMinibars,
        movements,
        audits,
        preferences,
        templates,
        suppliers,
        getProductById,
        getGuestPreference,
        getRoomMinibar,
        getRoomMinibarSummary,
        quickRestockRoom,
        quickConsumeItem,
        auditRoomMinibar,
        reabastecerTodosQuartos,
        saveProduct,
        deleteProduct,
        darEntradaEstoque,
        darBaixaAjuste,
        saveTemplate,
        saveGuestPreference,
        resetFrigobarData
      }}
    >
      {children}
    </FrigobarContext.Provider>
  );
};

export const useFrigobar = () => {
  const context = useContext(FrigobarContext);
  if (!context) {
    throw new Error('useFrigobar deve ser utilizado dentro de um FrigobarProvider');
  }
  return context;
};
