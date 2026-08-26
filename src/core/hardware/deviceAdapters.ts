export interface PrinterService {
  print(payload: { title: string; lines: string[] }): Promise<void>;
}

export interface ScannerService {
  scan(): Promise<string>;
}

export interface CameraService {
  capture(): Promise<Blob>;
}

export interface PaymentTerminalService {
  authorize(amount: number, method: string): Promise<{ reference: string }>;
}

export interface DeviceServiceAdapter {
  printer: PrinterService;
  scanner: ScannerService;
  camera: CameraService;
  paymentTerminal: PaymentTerminalService;
}

export const browserDeviceAdapters: DeviceServiceAdapter = {
  printer: { async print() { throw new Error('Impressora física não configurada.'); } },
  scanner: { async scan() { throw new Error('Scanner não configurado.'); } },
  camera: { async capture() { throw new Error('Câmera não configurada.'); } },
  paymentTerminal: { async authorize() { throw new Error('Terminal de pagamento não configurado.'); } },
};
