import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Check, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  ZoomIn, 
  ZoomOut, 
  Crop, 
  Maximize2, 
  Sliders, 
  Sparkles,
  Info,
  Layers,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { cropAndProcessImage, formatFileSize } from '../../../utils/imageHelper';

export interface AspectRatioOption {
  label: string;
  value: number | null; // width / height or null for free
  desc: string;
  icon?: string;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '21:9', value: 21 / 9, desc: 'Ultra-Wide (Hero Banner / Wallpaper)' },
  { label: '16:9', value: 16 / 9, desc: 'Widescreen (Fotos Horizontais)' },
  { label: '4:3', value: 4 / 3, desc: 'Padrão Hotelaria (Quartos & Espaços)' },
  { label: '3:2', value: 3 / 2, desc: 'Fotografia Clássica DSLR' },
  { label: '1:1', value: 1, desc: 'Quadrado (Logos & Avatares)' },
  { label: 'Livre', value: null, desc: 'Ajuste Livre / Sem Bloqueio' },
];

export const MAX_DIMENSIONS = [
  { label: '2560px (Ultra 2K)', value: 2560 },
  { label: '1920px (Full HD)', value: 1920 },
  { label: '1280px (HD Leve)', value: 1280 },
  { label: '800px (Médio)', value: 800 },
  { label: '400px (Mini / Avatar)', value: 400 },
  { label: 'Original', value: 0 },
];

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  defaultAspectRatio?: number | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Ajustar Enquadramento, Corte & Dimensões',
  defaultAspectRatio = null,
  onClose,
  onCropComplete
}) => {
  if (!isOpen || !imageSrc) return null;

  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [selectedRatio, setSelectedRatio] = useState<number | null>(defaultAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [maxDimension, setMaxDimension] = useState<number>(1920);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.90);
  const [isProcessing, setIsProcessing] = useState(false);

  // Panning e Crop Box (em porcentagem 0 a 100 da imagem natural)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startCropBox, setStartCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Carregar dimensões originais da imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      setNaturalSize({ width: w, height: h });
      resetCrop(w, h, selectedRatio);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Recalcular crop box quando o aspect ratio muda
  const resetCrop = (imgW = naturalSize.width, imgH = naturalSize.height, ratio = selectedRatio) => {
    if (!imgW || !imgH) return;

    if (ratio === null) {
      // 100% da imagem
      setCropBox({ x: 0, y: 0, width: 100, height: 100 });
    } else {
      const imgRatio = imgW / imgH;
      let boxW = 100;
      let boxH = 100;

      if (imgRatio > ratio) {
        // Imagem mais larga que a proporção desejada: limita altura a 90% e calcula largura
        boxH = 90;
        const targetPixelH = (imgH * boxH) / 100;
        const targetPixelW = targetPixelH * ratio;
        boxW = Math.min(100, (targetPixelW / imgW) * 100);
      } else {
        // Imagem mais alta que a proporção desejada: limita largura a 90% e calcula altura
        boxW = 90;
        const targetPixelW = (imgW * boxW) / 100;
        const targetPixelH = targetPixelW / ratio;
        boxH = Math.min(100, (targetPixelH / imgH) * 100);
      }

      const x = Math.max(0, (100 - boxW) / 2);
      const y = Math.max(0, (100 - boxH) / 2);
      setCropBox({ x, y, width: boxW, height: boxH });
    }
  };

  const handleRatioChange = (ratio: number | null) => {
    setSelectedRatio(ratio);
    resetCrop(naturalSize.width, naturalSize.height, ratio);
  };

  // Cálculo da resolução final estimada
  const calcOutputDimensions = () => {
    if (!naturalSize.width || !naturalSize.height) return { width: 0, height: 0, sizeEst: '0 KB' };

    const cropPxW = (naturalSize.width * cropBox.width) / 100;
    const cropPxH = (naturalSize.height * cropBox.height) / 100;

    let finalW = Math.round(cropPxW);
    let finalH = Math.round(cropPxH);

    if (maxDimension > 0 && finalW > maxDimension) {
      const scale = maxDimension / finalW;
      finalW = maxDimension;
      finalH = Math.round(finalH * scale);
    }

    // Estimativa de bytes (média 0.15 bytes por pixel para JPEG 90%)
    const estBytes = Math.round(finalW * finalH * (quality * 0.25));

    return {
      width: finalW,
      height: finalH,
      sizeEst: formatFileSize(estBytes)
    };
  };

  const outputMetrics = calcOutputDimensions();

  // Mouse & Touch Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartCropBox({ ...cropBox });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

    if (activeHandle === 'move') {
      let newX = startCropBox.x + deltaXPercent;
      let newY = startCropBox.y + deltaYPercent;

      // Limitar dentro de 0 a 100
      newX = Math.max(0, Math.min(100 - startCropBox.width, newX));
      newY = Math.max(0, Math.min(100 - startCropBox.height, newY));

      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (activeHandle === 'se' || activeHandle === 'e' || activeHandle === 's') {
      let newW = Math.max(10, Math.min(100 - startCropBox.x, startCropBox.width + deltaXPercent));
      let newH = Math.max(10, Math.min(100 - startCropBox.y, startCropBox.height + deltaYPercent));

      if (selectedRatio !== null && naturalSize.width && naturalSize.height) {
        // Manter proporção
        const imgRatio = naturalSize.width / naturalSize.height;
        const currentPixelW = (naturalSize.width * newW) / 100;
        const targetPixelH = currentPixelW / selectedRatio;
        newH = (targetPixelH / naturalSize.height) * 100;

        if (startCropBox.y + newH > 100) {
          newH = 100 - startCropBox.y;
          const maxPixelH = (naturalSize.height * newH) / 100;
          const maxPixelW = maxPixelH * selectedRatio;
          newW = (maxPixelW / naturalSize.width) * 100;
        }
      }

      setCropBox(prev => ({ ...prev, width: newW, height: newH }));
    } else if (activeHandle === 'nw') {
      let newX = Math.max(0, Math.min(startCropBox.x + startCropBox.width - 10, startCropBox.x + deltaXPercent));
      let newY = Math.max(0, Math.min(startCropBox.y + startCropBox.height - 10, startCropBox.y + deltaYPercent));
      let newW = startCropBox.width + (startCropBox.x - newX);
      let newH = startCropBox.height + (startCropBox.y - newY);

      setCropBox({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  // Executar corte e enviar resultado
  const handleApplyCrop = async () => {
    if (!naturalSize.width || !naturalSize.height) return;

    setIsProcessing(true);
    try {
      const pixelCrop = {
        x: Math.round((naturalSize.width * cropBox.x) / 100),
        y: Math.round((naturalSize.height * cropBox.y) / 100),
        width: Math.round((naturalSize.width * cropBox.width) / 100),
        height: Math.round((naturalSize.height * cropBox.height) / 100)
      };

      const resultDataUrl = await cropAndProcessImage(imageSrc, pixelCrop, {
        rotation,
        flipHorizontal: flipH,
        flipVertical: flipV,
        maxWidth: maxDimension > 0 ? maxDimension : undefined,
        maxHeight: maxDimension > 0 ? maxDimension : undefined,
        quality,
        format: outputFormat
      });

      onCropComplete(resultDataUrl);
      onClose();
    } catch (err) {
      console.error('Erro ao recortar imagem:', err);
      alert('Ocorreu um erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-stone-900 border border-stone-800 text-stone-100 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho do Estúdio de Corte */}
        <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif-luxury text-base text-stone-100 flex items-center gap-2">
                {title}
              </h3>
              <span className="text-xs text-stone-400">
                Original: {naturalSize.width} × {naturalSize.height}px • Enquadramento & Otimização
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              title="Cancelar e Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área Central: Visualizador Interativo + Painel Lateral de Ajustes */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          
          {/* Palco do Canvas / Visualizador Interativo (8 Colunas) */}
          <div className="lg:col-span-8 bg-stone-950 p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[340px] border-b lg:border-b-0 lg:border-r border-stone-800">
            
            {/* Imagem com Overlay de Corte */}
            <div 
              ref={containerRef}
              className="relative max-w-full max-h-[50vh] flex items-center justify-center overflow-hidden rounded-xl border border-stone-800 shadow-2xl bg-stone-900"
              style={{
                transform: `scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease'
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Para Recortar"
                className="max-h-[48vh] w-auto object-contain block pointer-events-none"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                }}
              />

              {/* Camada Escura Externa do Crop */}
              <div 
                className="absolute inset-0 bg-stone-950/65 pointer-events-none" 
              />

              {/* Caixa de Recorte Selecionada (Crop Box Iluminada) */}
              <div
                className="absolute border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move transition-[box-shadow]"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Linhas de Terços (Grid Fotográfico de Enquadramento) */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-white/60" />
                  <div className="border-r border-white/60" />
                  <div />
                </div>

                {/* Handles de Redimensionamento dos Cantos */}
                <div 
                  className="absolute -top-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-stone-950 rounded-sm cursor-nwse-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'nw')}
                />
                <div 
                  className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-stone-950 rounded-sm cursor-nesw-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'ne')}
                />
                <div 
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-stone-950 rounded-sm cursor-nesw-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'sw')}
                />
                <div 
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-stone-950 rounded-sm cursor-nwse-resize shadow"
                  onMouseDown={(e) => handleMouseDown(e, 'se')}
                />

                {/* Badge com Dimensão Atual Recortada */}
                <div className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 pointer-events-none shadow">
                  {outputMetrics.width} × {outputMetrics.height}px
                </div>
              </div>
            </div>

            {/* Barra Rápida Flutuante de Zoom e Rotação */}
            <div className="mt-4 flex items-center gap-2 bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-800 shadow-lg text-xs">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-stone-400 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-stone-700 mx-1" />

              <button
                type="button"
                onClick={() => setRotation(r => (r - 90) % 360)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
                title="Girar 90° Anti-horário"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
                title="Girar 90° Horário"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFlipH(f => !f)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${flipH ? 'bg-amber-500 text-stone-950' : 'hover:bg-stone-800 text-stone-300'}`}
                title="Espelhar Horizontalmente"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-stone-700 mx-1" />

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setFlipH(false);
                  setFlipV(false);
                  resetCrop();
                }}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition cursor-pointer text-[11px] flex items-center gap-1"
                title="Redefinir Todos os Ajustes"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

          </div>

          {/* Painel Lateral de Configurações, Proporções e Dimensões (4 Colunas) */}
          <div className="lg:col-span-4 p-5 sm:p-6 space-y-5 bg-stone-900 text-xs">
            
            {/* Seletor de Proporções de Enquadramento */}
            <div className="space-y-2">
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Proporção de Corte (Aspect Ratio)</span>
                <span className="text-amber-400 font-mono">
                  {selectedRatio === null ? 'Livre' : ASPECT_RATIOS.find(r => r.value === selectedRatio)?.label}
                </span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = selectedRatio === ratio.value;
                  return (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => handleRatioChange(ratio.value)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected 
                          ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400' 
                          : 'border-stone-800 bg-stone-950/60 hover:bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <strong className="text-xs font-bold text-stone-200">{ratio.label}</strong>
                      <span className="text-[9px] text-stone-500 truncate mt-0.5">{ratio.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seletor de Redimensionamento / Dimensão Máxima */}
            <div className="space-y-2 pt-3 border-t border-stone-800">
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                Dimensão Máxima de Saída (Otimização Web)
              </label>
              <select
                value={maxDimension}
                onChange={(e) => setMaxDimension(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 font-mono text-xs focus:ring-2 focus:ring-amber-500"
              >
                {MAX_DIMENSIONS.map((dim) => (
                  <option key={dim.value} value={dim.value}>{dim.label}</option>
                ))}
              </select>
            </div>

            {/* Qualidade e Formato de Compressão */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-800">
              <div>
                <label className="block font-bold text-stone-400 text-[10px] uppercase mb-1">
                  Formato de Saída
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 text-xs"
                >
                  <option value="image/jpeg">JPEG (Recomendado)</option>
                  <option value="image/webp">WebP (Ultraleve)</option>
                  <option value="image/png">PNG (Sem perda)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-400 text-[10px] uppercase mb-1 flex items-center justify-between">
                  <span>Qualidade</span>
                  <span className="text-amber-400 font-mono">{Math.round(quality * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-stone-800 rounded-lg cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Resumo dos Metadados Finais Calculados */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Resolução Final:</span>
                <strong className="font-mono text-amber-300 font-bold">
                  {outputMetrics.width} × {outputMetrics.height} px
                </strong>
              </div>
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Tamanho Estimado:</span>
                <span className="font-mono text-emerald-400">~{outputMetrics.sizeEst}</span>
              </div>
              <div className="flex items-center justify-between text-stone-400 text-[11px]">
                <span>Tempo de Carregamento:</span>
                <span className="text-emerald-400 font-medium">Instantâneo</span>
              </div>
            </div>

            {/* Dica de Enquadramento */}
            <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Arraste a caixa de seleção na foto para reposicionar o foco ou puxe os cantos para ajustar o tamanho do enquadramento.
              </span>
            </div>

          </div>

        </div>

        {/* Rodapé de Ações do Modal */}
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-bold transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleApplyCrop}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando Imagem...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Aplicar Corte & Salvar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
