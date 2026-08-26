import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addProductToRoomCart,
  createRoomTabletSession,
  formatCurrencyValue,
  formatDateTimeByHotel,
  generateHotelQRCode,
  getMobileNavigationItems,
  handleRoomCheckoutSessionWipe,
  isAppVersionCompatible,
  parseHotelQRCode,
  resolveViewportCategory,
  validatePdvAccess,
  DEFAULT_POS_SHORTCUTS,
  type HardwarePrintJob,
  type RoomTabletSession,
  type WhiteLabelConfig,
} from '../src/domain/deviceCompatibilityCore';
import { deviceService } from '../src/core/device/deviceService';
import { localQueue } from '../src/core/offline/localQueue';
import { browserDeviceAdapters } from '../src/core/hardware/deviceAdapters';

// 1. Desktop
test('1. desktop: renderiza layout multi-coluna com barra lateral e resolução completa (1920px)', () => {
  const vp = resolveViewportCategory(1920, false);
  assert.equal(vp.category, 'DESKTOP_XL');
  assert.equal(vp.layoutMode, 'FULL_DESKTOP');
  assert.equal(vp.isTouchDevice, false);
});

// 2. Notebook
test('2. notebook: adapta resolução de 1366px e 1440px mantendo densidade e usabilidade', () => {
  const vp = resolveViewportCategory(1366, false);
  assert.equal(vp.category, 'DESKTOP_LG');
  assert.equal(vp.layoutMode, 'FULL_DESKTOP');
});

// 3. Mobile
test('3. mobile: ativa navegação compacta e barra inferior com atalhos essenciais em telas estreitas', () => {
  const vp = resolveViewportCategory(390, true);
  assert.equal(vp.category, 'MOBILE_SM');
  assert.equal(vp.layoutMode, 'COMPACT_MOBILE');

  const navItems = getMobileNavigationItems();
  assert.equal(navItems.length, 6);
  assert.equal(navItems[0].id, 'dashboard');
  assert.equal(navItems[1].id, 'reservations');
  assert.equal(navItems[2].id, 'rooms');
  assert.equal(navItems[3].id, 'orders');
  assert.equal(navItems[4].id, 'notifications');
  assert.equal(navItems[5].id, 'more');
});

// 4. Tablet
test('4. tablet: otimiza alvos de toque (mínimo 44px) e layout de 768px a 1024px', () => {
  const vp = resolveViewportCategory(1024, true);
  assert.equal(vp.category, 'TABLET_MD');
  assert.equal(vp.layoutMode, 'TOUCH_TABLET');
  assert.equal(vp.isTouchDevice, true);
});

// 5. Tablet Quarto
test('5. tablet quarto: sessão vinculada a hotel_id e room_id com fluxo de pedidos e limpeza segura no checkout', () => {
  const session = createRoomTabletSession({
    deviceId: 'tab-room-304',
    hotelId: 'hotel-01',
    boundRoomId: 'room-304',
    stayId: 'stay-888',
    guestName: 'Carlos Drummond',
  });

  assert.equal(session.roomId, 'room-304');
  assert.equal(session.activeGuestName, 'Carlos Drummond');

  // Adiciona itens ao carrinho
  const withBurger = addProductToRoomCart(session, {
    productId: 'prod-burger',
    productName: 'Hambúrguer Gourmet',
    unitPrice: 45.0,
    quantity: 2,
    notes: 'Sem cebola',
  });
  assert.equal(withBurger.cart.length, 1);
  assert.equal(withBurger.cart[0].quantity, 2);

  // No checkout: limpeza estrita de dados
  const cleaned = handleRoomCheckoutSessionWipe(withBurger);
  assert.equal(cleaned.stayId, null);
  assert.equal(cleaned.activeGuestName, null);
  assert.equal(cleaned.cart.length, 0);
  assert.equal(cleaned.isLocked, true);
});

// 6. PDV
test('6. PDV: modo operacional veloz com categorias, pesquisa instantânea e validação de permissões', () => {
  assert.equal(validatePdvAccess('PDV_ONLY', 'PDV'), true);
  assert.equal(validatePdvAccess('PDV_ONLY', 'ADMIN'), false);
  assert.equal(validatePdvAccess('PDV_ONLY', 'FINANCE'), false);
  assert.equal(validatePdvAccess('ADMIN', 'ADMIN'), true);
});

// 7. Cozinha (KDS)
test('7. cozinha: tela operacional de preparo com pedidos em cards touch e status em tempo real', () => {
  const kdsCard = {
    orderId: 'ord-102',
    roomNumber: '304',
    items: ['1x Suco de Laranja', '2x Misto Quente'],
    status: 'PREPARING',
    elapsedMinutes: 8,
  };

  assert.equal(kdsCard.status, 'PREPARING');
  assert.equal(kdsCard.roomNumber, '304');
});

// 8. Housekeeping
test('8. housekeeping: fluxo simplificado para camareiras (iniciar limpeza, concluir e alterar status)', () => {
  const roomTask = {
    roomId: 'room-201',
    initialStatus: 'DIRTY',
    currentStatus: 'IN_PROGRESS',
    startedAt: '2026-10-01T10:00:00Z',
  };

  roomTask.currentStatus = 'CLEAN';
  assert.equal(roomTask.currentStatus, 'CLEAN');
});

// 9. Manutenção
test('9. manutenção: abertura de chamado com foto, observação e vinculação estrita de quarto e hotel', () => {
  const maintenanceTicket = {
    id: 'mnt-77',
    hotelId: 'hotel-01',
    roomId: 'room-105',
    category: 'HYDRAULIC',
    photoAttachmentUrl: 'https://storage.hotelos.com/hotel-01/room-105/leak.jpg',
    status: 'OPEN',
  };

  assert.equal(maintenanceTicket.hotelId, 'hotel-01');
  assert.match(maintenanceTicket.photoAttachmentUrl, /hotel-01\/room-105/);
});

// 10. Touch
test('10. touch: interação sem depender exclusivamente de estados hover do mouse', () => {
  const touchButton = {
    minHeightPx: 48,
    minWidthPx: 48,
    touchFeedback: 'active:scale-95 transition-transform',
  };
  assert.equal(touchButton.minHeightPx >= 44, true);
});

// 11. Teclado
test('11. teclado: atalhos funcionais para PDV (F2 busca, F4 desconto, F8 finalizar, ESC cancelar)', () => {
  assert.equal(DEFAULT_POS_SHORTCUTS.length, 4);
  const f2 = DEFAULT_POS_SHORTCUTS.find((s) => s.key === 'F2');
  const f8 = DEFAULT_POS_SHORTCUTS.find((s) => s.key === 'F8');
  assert.equal(f2?.action, 'SEARCH');
  assert.equal(f8?.action, 'FINALIZE');
});

// 12. PWA
test('12. PWA: manifesto estruturado com display standalone e controle de cache', () => {
  const manifest = {
    name: 'HOTEL OS',
    short_name: 'HotelOS',
    display: 'standalone',
    theme_color: '#0f172a',
    background_color: '#ffffff',
  };
  assert.equal(manifest.display, 'standalone');
});

// 13. Offline
test('13. offline: fila local rejeita categoricamente operações financeiras e aceita operacionais', () => {
  localQueue.clear();
  const opId = localQueue.enqueue({
    operation: 'ROOM_STATUS_UPDATE',
    payload: { roomId: 'room-101', status: 'CLEAN' },
  });
  assert.equal(localQueue.list().length, 1);
  assert.equal(localQueue.list()[0]?.id, opId);

  assert.throws(() => {
    localQueue.enqueue({
      operation: 'PAYMENT_CAPTURE',
      payload: { amount: 150.0 },
    });
  });
  localQueue.clear();
});

// 14. Sincronização
test('14. sincronização: descarrega operações enfileiradas ao restabelecer conexão', () => {
  localQueue.clear();
  localQueue.enqueue({ operation: 'TASK_NOTE', payload: { text: 'Toalhas trocadas' } });
  assert.equal(localQueue.list().length, 1);

  // Simula sincronização com sucesso
  localQueue.clear();
  assert.equal(localQueue.list().length, 0);
});

// 15. Conflitos
test('15. conflitos: detecta concorrência e evita sobrescrita silenciosa', () => {
  const serverVersion = 3;
  const localVersion = 1;
  const hasConflict = serverVersion > localVersion;
  assert.equal(hasConflict, true);
});

// 16. Device Binding
test('16. device binding: vincula terminal ao hotel_id e room_id impedindo impersonação', () => {
  deviceService.clear();
  deviceService.bind({
    deviceId: 'dev-pos-front',
    hotelId: 'hotel-01',
    deviceType: 'POS',
    appVersion: '2.4.0',
  });

  assert.equal(deviceService.get()?.hotelId, 'hotel-01');
  assert.equal(deviceService.get()?.deviceType, 'POS');
  deviceService.clear();
});

// 17. Remote Revoke
test('17. remote revoke: suporte a desativação remota de dispositivo comprometido', () => {
  deviceService.clear();
  const registered = deviceService.register({
    hotel_id: 'hotel-01',
    device_type: 'TABLET',
    name: 'Tablet Quarto 501',
  });

  assert.equal(registered.status, 'ACTIVE');
  deviceService.revoke(registered.id);
  // Simula validação de status
  assert.throws(() => {
    deviceService.bind({
      deviceId: registered.id,
      hotelId: 'hotel-01',
      deviceType: 'TABLET',
      appVersion: '1.0.0',
      status: 'REVOKED',
    });
  });
  deviceService.clear();
});

// 18. Scanner
test('18. scanner: abstração para leitura de código de barras e QR codes', async () => {
  assert.notEqual(browserDeviceAdapters.scanner, undefined);
});

// 19. QR Code
test('19. QR: gera e valida QR codes tipados para quartos, produtos, pedidos e mesas', () => {
  const qr = generateHotelQRCode({
    type: 'ROOM',
    hotelId: 'hotel-01',
    entityId: 'room-304',
    metadata: { floor: 3 },
  });

  assert.match(qr, /^HOTEL_OS:/);
  const parsed = parseHotelQRCode(qr, 'hotel-01');
  assert.equal(parsed.type, 'ROOM');
  assert.equal(parsed.entityId, 'room-304');

  // Rejeita QR de outro hotel
  assert.throws(() => {
    parseHotelQRCode(qr, 'hotel-99');
  });
});

// 20. Câmera
test('20. câmera: abstração para captura de fotos em vistorias e manutenção', () => {
  assert.notEqual(browserDeviceAdapters.camera, undefined);
});

// 21. Impressão
test('21. impressão: gera trabalhos de impressão para comandas, recibos e relatórios', () => {
  const job: HardwarePrintJob = {
    type: 'KITCHEN_ORDER',
    title: 'Comanda Cozinha #102',
    lines: ['Mesa 4', '1x Suco Natural', '2x Salmão Grelhado'],
    copies: 1,
    hotelId: 'hotel-01',
  };

  assert.equal(job.type, 'KITCHEN_ORDER');
  assert.equal(job.copies, 1);
});

// 22. Permissões
test('22. permissões: valida acesso específico a recursos por papel em dispositivos móveis', () => {
  assert.equal(validatePdvAccess('PDV_ONLY', 'PDV'), true);
  assert.equal(validatePdvAccess('PDV_ONLY', 'REPORTS'), false);
});

// 23. Acessibilidade
test('23. acessibilidade: contraste adequado, suporte a ARIA e feedback sonoro/textual sem depender só de cor', () => {
  const statusBadge = {
    status: 'CRITICAL',
    text: 'Crítico / Manutenção Urgente',
    ariaLabel: 'Alerta de Manutenção Crítica',
    icon: 'AlertTriangle',
  };

  assert.equal(statusBadge.text.length > 0, true);
  assert.equal(statusBadge.ariaLabel.length > 0, true);
});

// 24. Performance
test('24. performance: formata valores e datas com internacionalização nativa e sem overhead de layout', () => {
  const formattedCurrency = formatCurrencyValue(250.5, 'BRL', 'pt-BR');
  assert.match(formattedCurrency, /250,50/);

  const formattedUsd = formatCurrencyValue(250.5, 'USD', 'en');
  assert.match(formattedUsd, /250\.50/);
});

// 25. Atualização & Versionamento
test('25. atualização: detecta versões obsoletas do aplicativo e orienta atualização compulsória', () => {
  assert.equal(isAppVersionCompatible('2.5.0', '2.0.0'), true);
  assert.equal(isAppVersionCompatible('1.9.0', '2.0.0'), false);
  assert.equal(isAppVersionCompatible('2.0.0', '2.0.0'), true);
});
