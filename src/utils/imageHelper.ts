/**
 * Utilitários avançados para processamento de imagens no navegador:
 * - Leitura de arquivos (FileReader)
 * - Canvas Crop com zoom, rotação e flip
 * - Redimensionamento e compressão inteligente (JPEG/WebP/PNG)
 * - Obtenção de dimensões e metadados
 */

export interface CropArea {
  x: number; // 0 to 1 (proporção relativa) ou pixels
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  aspectRatio?: number; // width / height (ex: 16/9, 1/1, 21/9, 4/3, undefined para livre)
  zoom: number; // 1 = 100%
  rotation: number; // graus (0, 90, 180, 270 ou contínuo)
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Lê um arquivo File do input ou drag-and-drop e converte em Base64 Data URL
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao converter arquivo para texto Base64'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Carrega uma imagem HTMLImageElement a partir de uma URL ou Data URL
 */
export const createImageElement = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback sem cors caso falhe
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (err) => reject(err);
      fallbackImg.src = url;
    };
    img.src = url;
  });
};

/**
 * Retorna as dimensões originais de uma imagem
 */
export const getImageDimensions = async (url: string): Promise<{ width: number; height: number; aspectRatio: number }> => {
  try {
    const img = await createImageElement(url);
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height)
    };
  } catch {
    return { width: 0, height: 0, aspectRatio: 1 };
  }
};

/**
 * Executa o corte e renderização de alta fidelidade em Canvas
 */
export const cropAndProcessImage = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  options: {
    rotation?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/webp' | 'image/png';
  } = {}
): Promise<string> => {
  const image = await createImageElement(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Não foi possível inicializar contexto 2D do Canvas');
  }

  const rotation = options.rotation || 0;
  const flipH = options.flipHorizontal || false;
  const flipV = options.flipVertical || false;
  const quality = options.quality !== undefined ? options.quality : 0.88;
  const format = options.format || 'image/jpeg';

  // Dimensões alvo do corte
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  // Redimensionamento proporcional se exceder limite máximo
  if (options.maxWidth && targetWidth > options.maxWidth) {
    const scale = options.maxWidth / targetWidth;
    targetWidth = options.maxWidth;
    targetHeight = Math.round(targetHeight * scale);
  }

  if (options.maxHeight && targetHeight > options.maxHeight) {
    const scale = options.maxHeight / targetHeight;
    targetHeight = options.maxHeight;
    targetWidth = Math.round(targetWidth * scale);
  }

  // Garantir limites mínimos
  targetWidth = Math.max(1, Math.round(targetWidth));
  targetHeight = Math.max(1, Math.round(targetHeight));

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Suavização de alta qualidade
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fundo neutro (branco para JPEG)
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.save();

  // Mover para o centro do canvas para rotações e espelhamentos
  ctx.translate(targetWidth / 2, targetHeight / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Desenhar a porção recortada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight
  );

  ctx.restore();

  return canvas.toDataURL(format, quality);
};

/**
 * Formata bytes em KB ou MB legível
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Estima o tamanho em bytes de uma string Base64 Data URL
 */
export const estimateDataUrlSize = (dataUrl: string): number => {
  if (!dataUrl || !dataUrl.includes('base64,')) return 0;
  const base64Str = dataUrl.split('base64,')[1] || '';
  return Math.round((base64Str.length * 3) / 4);
};
