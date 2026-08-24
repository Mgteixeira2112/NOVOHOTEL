/**
 * Utilitário de Geração de Código PIX Copia e Cola (Padrão Banco Central / EMV QR Code)
 * e Cálculo de Checksum CRC16-CCITT (0xFFFF)
 */

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  const strlen = str.length;
  for (let c = 0; c < strlen; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  let hex = (crc & 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

export interface GeneratePixPayloadOptions {
  chave: string;
  nomeTitular: string;
  cidade: string;
  valor?: number;
  txId?: string;
  descricao?: string;
}

export function generatePixPayload({
  chave,
  nomeTitular,
  cidade,
  valor,
  txId = '***',
  descricao
}: GeneratePixPayloadOptions): string {
  // Limpeza de campos para conformidade EMV
  const cleanKey = chave.trim();
  const cleanName = nomeTitular
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 25);
  const cleanCity = cidade
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .slice(0, 15);
  const cleanTxId = (txId || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';

  // 00: Payload Format Indicator
  let payload = formatEmvField('00', '01');

  // 26: Merchant Account Information - PIX
  let gui = formatEmvField('00', 'br.gov.bcb.pix');
  let keyField = formatEmvField('01', cleanKey);
  let descField = descricao ? formatEmvField('02', descricao.slice(0, 50)) : '';
  let merchantAccount = gui + keyField + descField;
  payload += formatEmvField('26', merchantAccount);

  // 52: Merchant Category Code (0000 = Geral / Hotelaria)
  payload += formatEmvField('52', '0000');

  // 53: Transaction Currency (986 = Real Brasileiro)
  payload += formatEmvField('53', '986');

  // 54: Transaction Amount
  if (valor && valor > 0) {
    payload += formatEmvField('54', valor.toFixed(2));
  }

  // 58: Country Code
  payload += formatEmvField('58', 'BR');

  // 59: Merchant Name
  payload += formatEmvField('59', cleanName || 'HOTEL');

  // 60: Merchant City
  payload += formatEmvField('60', cleanCity || 'SAO PAULO');

  // 62: Additional Data Field (TXID)
  let txidField = formatEmvField('05', cleanTxId);
  payload += formatEmvField('62', txidField);

  // 63: CRC16 Checksum
  payload += '6304';
  const checksum = crc16(payload);

  return `${payload}${checksum}`;
}

export function generateQrCodeUrl(text: string, size: number = 250): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=8`;
}
