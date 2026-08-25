import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Crop, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Check, 
  Link as LinkIcon, 
  Sparkles, 
  Image as ImageIcon, 
  FileImage, 
  Info,
  Maximize2,
  Database,
  CloudCheck
} from 'lucide-react';
import { readFileAsDataURL, getImageDimensions, formatFileSize, estimateDataUrlSize } from '../../../utils/imageHelper';
import { ImageCropperModal } from './ImageCropperModal';
import { uploadHotelImage } from '../../../services/mediaService';
import { MediaCategory, MediaUploadRecord } from '../../../types';

export interface ImagePresetItem {
  id: string;
  name: string;
  category?: string;
  url: string;
  description?: string;
}

interface SingleImageUploaderProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  description?: string;
  aspectRatioHint?: string; // Ex: '21:9', '16:9', '1:1'
  defaultAspectRatio?: number | null;
  presets?: ImagePresetItem[];
  presetsTitle?: string;
  placeholder?: string;
  className?: string;
  previewHeightClass?: string; // Ex: 'aspect-[21/9] max-h-72', 'h-40', etc.
  allowUrlFallback?: boolean;
  category?: MediaCategory;
  roomId?: string | null;
  autoUploadToSupabase?: boolean;
  onRecordUploaded?: (record: MediaUploadRecord) => void;
}

export const SingleImageUploader: React.FC<SingleImageUploaderProps> = ({
  label,
  value,
  onChange,
  description,
  aspectRatioHint = '16:9',
  defaultAspectRatio = 16 / 9,
  presets,
  presetsTitle = 'Ou escolha um modelo pronto de alta definição:',
  placeholder = 'Clique ou arraste uma foto aqui',
  className = '',
  previewHeightClass = 'aspect-[16/9] max-h-64',
  allowUrlFallback = true,
  category = 'outro',
  roomId = null,
  autoUploadToSupabase = true,
  onRecordUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [isSavedInSupabase, setIsSavedInSupabase] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value || '');
  const [dimensions, setDimensions] = useState<{ width: number; height: number; aspectRatio: number }>({
    width: 0,
    height: 0,
    aspectRatio: 1
  });
  const [fileSizeStr, setFileSizeStr] = useState<string>('');

  // Helper de upload para o Supabase
  const pushToSupabase = async (imageDataUrlOrUrl: string, cropInfo?: Record<string, any>) => {
    if (!autoUploadToSupabase || !imageDataUrlOrUrl) return;
    setIsUploadingToCloud(true);
    try {
      const res = await uploadHotelImage({
        fileOrDataUrl: imageDataUrlOrUrl,
        category,
        roomId,
        isCover: true,
        width: dimensions.width || null,
        height: dimensions.height || null,
        aspectRatio: aspectRatioHint || null,
        cropData: cropInfo || null,
      });

      if (res.success) {
        setIsSavedInSupabase(true);
        if (res.record && onRecordUploaded) {
          onRecordUploaded(res.record);
        }
        // Se o Supabase retornou uma URL de Storage pública, atualiza o state pai
        if (res.url && res.url.startsWith('http') && res.url !== value) {
          onChange(res.url);
        }
      }
    } catch (err) {
      console.warn('Upload em background no Supabase:', err);
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  // Sincronizar rascunho de URL
  useEffect(() => {
    setUrlDraft(value || '');
    if (value) {
      getImageDimensions(value).then(dims => setDimensions(dims));
      const sizeBytes = estimateDataUrlSize(value);
      if (sizeBytes > 0) {
        setFileSizeStr(formatFileSize(sizeBytes));
      } else {
        setFileSizeStr('');
      }
      setIsSavedInSupabase(value.includes('supabase.co/storage') || value.startsWith('http'));
    } else {
      setDimensions({ width: 0, height: 0, aspectRatio: 1 });
      setFileSizeStr('');
      setIsSavedInSupabase(false);
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataURL(file);
      onChange(dataUrl);
      // Abrir o cropper automaticamente para enquadramento opcional
      setIsCropperOpen(true);
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      alert('Falha ao processar arquivo de imagem. Tente outro formato (JPG, PNG, WebP).');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        onChange(dataUrl);
        setIsCropperOpen(true);
      } catch (err) {
        console.error('Erro ao ler arquivo solto:', err);
      }
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setShowUrlInput(false);
      pushToSupabase(urlDraft.trim());
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlDraft('');
    setIsSavedInSupabase(false);
  };

  const hasImage = Boolean(value && value.trim().length > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      
      {/* Cabeçalho do Campo com Rótulo e Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>{label}</span>
          </label>
          {description && (
            <p className="text-[11px] text-stone-500 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {aspectRatioHint && (
            <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-600 font-semibold">
              Proporção: {aspectRatioHint}
            </span>
          )}
          {dimensions.width > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-mono text-amber-800 font-bold">
              {dimensions.width}×{dimensions.height}px
            </span>
          )}
          {fileSizeStr && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800">
              {fileSizeStr}
            </span>
          )}
          {isUploadingToCloud ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/50 text-[10px] font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              <span>Nuvem Supabase...</span>
            </span>
          ) : isSavedInSupabase ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
              <Database className="w-2.5 h-2.5 text-emerald-600" />
              <span>Supabase Storage</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Input de Arquivo Oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Card Principal: Visualizador ou Zona de Drag & Drop */}
      {hasImage ? (
        <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-stone-950 shadow-sm group">
          
          {/* Imagem de Fundo Renderizada */}
          <div className={`w-full ${previewHeightClass} flex items-center justify-center overflow-hidden relative`}>
            <img
              src={value}
              alt={label}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/30 pointer-events-none" />
          </div>

          {/* Barra de Ações Rápidas Sobreposta na Imagem */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 flex-wrap bg-stone-950/85 backdrop-blur-md p-2 rounded-xl border border-stone-800 text-xs shadow-xl">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Abrir ferramenta de corte, zoom e redimensionamento"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Cortar & Dimensionar</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Trocar por outra foto do computador/celular"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Trocar Imagem</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {allowUrlFallback && (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                  title="Editar via Link / URL"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition cursor-pointer"
                title="Remover Imagem"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Zona de Upload Vazia (Drag & Drop + Botão) */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragOver 
              ? 'border-amber-500 bg-amber-50/50 scale-[1.01]' 
              : 'border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-white'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <strong className="block text-xs sm:text-sm font-bold text-stone-900">
              {placeholder}
            </strong>
            <p className="text-[11px] text-stone-500">
              Suporta arquivos JPG, PNG, WebP ou GIF do seu dispositivo
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold shadow-sm transition">
              Selecionar do Computador / Celular
            </span>
          </div>
        </div>
      )}

      {/* Campo Opcional de Inserção por URL Direta */}
      {allowUrlFallback && (showUrlInput || !hasImage) && (
        <div className="pt-2">
          {!showUrlInput && !hasImage ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <LinkIcon className="w-3 h-3 text-stone-400" />
              <span>Ou cole um link de imagem diretamente (URL)</span>
            </button>
          ) : (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-stone-600 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-amber-500" />
                  <span>Inserir Link de Imagem Web (URL)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="text-[10px] text-stone-400 hover:text-stone-600"
                >
                  Fechar
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs text-stone-900"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-2 rounded-lg bg-stone-900 text-amber-300 text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade de Presets Prontos (Se fornecido) */}
      {presets && presets.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-stone-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{presetsTitle}</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {presets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => onChange(preset.url)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-[16/10] ${
                    isSelected 
                      ? 'border-amber-500 ring-2 ring-amber-400 shadow-md scale-[1.02]' 
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent p-2 flex flex-col justify-end">
                    {preset.category && (
                      <span className="text-[8px] font-bold text-amber-300 uppercase tracking-wider block">
                        {preset.category}
                      </span>
                    )}
                    <strong className="text-[11px] text-white font-bold leading-tight truncate">
                      {preset.name}
                    </strong>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow text-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Interativo de Corte & Dimensionamento */}
      {isCropperOpen && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={value}
          title={`Ajustar Enquadramento — ${label}`}
          defaultAspectRatio={defaultAspectRatio}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={(croppedDataUrl) => {
            onChange(croppedDataUrl);
            pushToSupabase(croppedDataUrl);
          }}
        />
      )}

    </div>
  );
};
