export type DeviceContextType =
  | 'DESKTOP'
  | 'NOTEBOOK'
  | 'MOBILE'
  | 'TABLET'
  | 'TABLET_ROOM'
  | 'TABLET_HOUSEKEEPING'
  | 'TABLET_MAINTENANCE'
  | 'POS'
  | 'KITCHEN_KDS';

export type ScreenResolutionCategory =
  | 'MOBILE_XS' // 320px
  | 'MOBILE_SM' // 375px - 390px - 430px
  | 'TABLET_MD' // 768px - 1024px
  | 'DESKTOP_LG' // 1280px - 1440px
  | 'DESKTOP_XL'; // 1920px+

export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export type SupportedLocale = 'pt-BR' | 'en' | 'es';

export interface ViewportConfig {
  width: number;
  height: number;
  isTouchDevice: boolean;
  category: ScreenResolutionCategory;
  layoutMode: 'COMPACT_MOBILE' | 'TOUCH_TABLET' | 'FULL_DESKTOP';
}

export interface RoomTabletSession {
  deviceId: string;
  hotelId: string;
  roomId: string;
  stayId: string | null;
  activeGuestName?: string | null;
  cart: RoomOrderItemDraft[];
  sessionStartedAt: string;
  isLocked: boolean;
}

export interface RoomOrderItemDraft {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface POSModeConfig {
  mode: 'RESTAURANT' | 'BAR' | 'FRONT_DESK' | 'ROOM_SERVICE' | 'SHOP';
  defaultCatalogCategory?: string;
  allowTableSelection: boolean;
  allowRoomCharge: boolean;
  requirePinForDiscount: boolean;
}

export interface POSKeyboardShortcut {
  key: string;
  action: 'SEARCH' | 'DISCOUNT' | 'FINALIZE' | 'CANCEL';
  description: string;
}

export const DEFAULT_POS_SHORTCUTS: POSKeyboardShortcut[] = [
  { key: 'F2', action: 'SEARCH', description: 'Abrir pesquisa de produtos' },
  { key: 'F4', action: 'DISCOUNT', description: 'Aplicar desconto autorizado' },
  { key: 'F8', action: 'FINALIZE', description: 'Finalizar comanda/pagamento' },
  { key: 'Escape', action: 'CANCEL', description: 'Cancelar item/operação atual' },
];

export interface WhiteLabelConfig {
  hotelName: string;
  logoUrl?: string;
  heroImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  locale: SupportedLocale;
  currency: 'BRL' | 'USD' | 'EUR';
  timezone: string;
}

export interface QRCodePayload {
  type: 'ROOM' | 'PRODUCT' | 'ORDER' | 'TABLE';
  hotelId: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  issuedAt: string;
}

export interface HardwarePrintJob {
  type: 'RECEIPT' | 'KITCHEN_ORDER' | 'REPORT' | 'LABEL';
  title: string;
  lines: string[];
  copies: number;
  hotelId: string;
  terminalId?: string;
}

/**
 * 1. Resolução de Viewport e Layout Responsivo
 */
export function resolveViewportCategory(width: number, isTouch = false): ViewportConfig {
  if (width < 360) {
    return {
      width,
      height: 640,
      isTouchDevice: true,
      category: 'MOBILE_XS',
      layoutMode: 'COMPACT_MOBILE',
    };
  }
  if (width < 768) {
    return {
      width,
      height: 844,
      isTouchDevice: true,
      category: 'MOBILE_SM',
      layoutMode: 'COMPACT_MOBILE',
    };
  }
  if (width < 1200) {
    return {
      width,
      height: 1024,
      isTouchDevice: isTouch || true,
      category: 'TABLET_MD',
      layoutMode: 'TOUCH_TABLET',
    };
  }
  if (width < 1600) {
    return {
      width,
      height: 900,
      isTouchDevice: isTouch,
      category: 'DESKTOP_LG',
      layoutMode: 'FULL_DESKTOP',
    };
  }
  return {
    width,
    height: 1080,
    isTouchDevice: isTouch,
    category: 'DESKTOP_XL',
    layoutMode: 'FULL_DESKTOP',
  };
}

/**
 * 2. Navegação Mobile Compacta
 */
export function getMobileNavigationItems() {
  return [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/app/dashboard' },
    { id: 'reservations', label: 'Reservas', icon: 'CalendarDays', route: '/app/reservations' },
    { id: 'rooms', label: 'Quartos', icon: 'DoorClosed', route: '/app/rooms' },
    { id: 'orders', label: 'Pedidos', icon: 'ShoppingBag', route: '/app/orders' },
    { id: 'notifications', label: 'Notificações', icon: 'Bell', route: '/app/notifications' },
    { id: 'more', label: 'Mais', icon: 'Menu', route: '/app/menu' },
  ];
}

/**
 * 3. Gestão de Sessão do Tablet do Quarto (com isolamento e limpeza de checkout)
 */
export function createRoomTabletSession(params: {
  deviceId: string;
  hotelId: string;
  boundRoomId: string;
  stayId: string | null;
  guestName?: string | null;
}): RoomTabletSession {
  if (!params.deviceId || !params.hotelId || !params.boundRoomId) {
    throw new Error('DEVICE_ID_HOTEL_ID_AND_ROOM_ID_REQUIRED');
  }

  return {
    deviceId: params.deviceId,
    hotelId: params.hotelId,
    roomId: params.boundRoomId,
    stayId: params.stayId,
    activeGuestName: params.guestName || null,
    cart: [],
    sessionStartedAt: new Date().toISOString(),
    isLocked: false,
  };
}

export function handleRoomCheckoutSessionWipe(session: RoomTabletSession): RoomTabletSession {
  // Limpa completamente dados de carrinho, hóspede e token anterior
  return {
    ...session,
    stayId: null,
    activeGuestName: null,
    cart: [],
    isLocked: true, // Bloqueia até novo check-in
    sessionStartedAt: new Date().toISOString(),
  };
}

/**
 * 4. Fluxo de Pedido do Tablet do Quarto
 */
export function addProductToRoomCart(
  session: RoomTabletSession,
  item: { productId: string; productName: string; unitPrice: number; quantity: number; notes?: string }
): RoomTabletSession {
  if (item.quantity <= 0) {
    throw new Error('QUANTITY_MUST_BE_GREATER_THAN_ZERO');
  }

  const existingIndex = session.cart.findIndex(
    (c) => c.productId === item.productId && (c.notes || '') === (item.notes || '')
  );

  let updatedCart: RoomOrderItemDraft[];
  if (existingIndex >= 0) {
    updatedCart = [...session.cart];
    const existing = updatedCart[existingIndex];
    if (existing) {
      updatedCart[existingIndex] = {
        ...existing,
        quantity: existing.quantity + item.quantity,
      };
    }
  } else {
    updatedCart = [...session.cart, item];
  }

  return {
    ...session,
    cart: updatedCart,
  };
}

/**
 * 5. Segurança do PDV & Role PDV_ONLY
 */
export function validatePdvAccess(userRole: string, requestedModule: 'PDV' | 'ADMIN' | 'FINANCE' | 'REPORTS'): boolean {
  if (userRole === 'PDV_ONLY') {
    return requestedModule === 'PDV';
  }
  return true;
}

/**
 * 6. QR Code Gerador e Validador com Contexto
 */
export function generateHotelQRCode(payload: Omit<QRCodePayload, 'issuedAt'>): string {
  const fullPayload: QRCodePayload = {
    ...payload,
    issuedAt: new Date().toISOString(),
  };
  return `HOTEL_OS:${Buffer.from(JSON.stringify(fullPayload)).toString('base64')}`;
}

export function parseHotelQRCode(qrString: string, expectedHotelId: string): QRCodePayload {
  if (!qrString.startsWith('HOTEL_OS:')) {
    throw new Error('INVALID_QR_CODE_FORMAT');
  }
  const base64Data = qrString.replace('HOTEL_OS:', '');
  const decoded = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf-8')) as QRCodePayload;

  if (decoded.hotelId !== expectedHotelId) {
    throw new Error('QR_CODE_HOTEL_MISMATCH');
  }

  return decoded;
}

/**
 * 7. Internacionalização & Formatação Oficial
 */
export function formatCurrencyValue(amount: number, currency: 'BRL' | 'USD' | 'EUR' = 'BRL', locale: SupportedLocale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDateTimeByHotel(
  date: Date | string,
  timezone: string = 'America/Sao_Paulo',
  locale: SupportedLocale = 'pt-BR'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(d);
}

/**
 * 8. Validação de Compatibilidade de Versões do App
 */
export function isAppVersionCompatible(deviceVersion: string, minimumSupportedVersion: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const dev = parse(deviceVersion);
  const min = parse(minimumSupportedVersion);

  for (let i = 0; i < Math.max(dev.length, min.length); i++) {
    const d = dev[i] ?? 0;
    const m = min[i] ?? 0;
    if (d > m) return true;
    if (d < m) return false;
  }
  return true;
}
