import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Crop, 
  Trash2, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Link as LinkIcon, 
  Eye, 
  X,
  Maximize2,
  Database,
  RefreshCw
} from 'lucide-react';
import { readFileAsDataURL } from '../../../utils/imageHelper';
import { ImageCropperModal } from './ImageCropperModal';
import { uploadHotelImage } from '../../../services/mediaService';
import { MediaCategory } from '../../../types';

export interface MultiImageGalleryUploaderProps {
  label: string;
  images: string[];
  onChange: (newImages: string[]) => void;
  description?: string;
  maxImages?: number;
  presets?: Array<{ id: string; name: string; url: string; category?: string }>;
  category?: MediaCategory;
  roomId?: string | null;
  autoUploadToSupabase?: boolean;
}

export const MultiImageGalleryUploader: React.FC<MultiImageGalleryUploaderProps> = ({
  label,
  images = [],
  onChange,
  description,
  maxImages = 20,
  presets,
  category = 'quarto',
  roomId = null,
  autoUploadToSupabase = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [showUrlAdd, setShowUrlAdd] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const pushSingleToSupabase = async (url: string, index: number, isCover: boolean) => {
    if (!autoUploadToSupabase || !url) return;
    try {
      const res = await uploadHotelImage({
        fileOrDataUrl: url,
        category,
        roomId,
        isCover,
        sortOrder: index,
      });
      if (res.success && res.url && res.url.startsWith('http') && res.url !== url) {
        // Atualiza a URL se virou pública do Storage
        onChange(images.map((img, i) => (i === index ? res.url : img)));
      }
    } catch (e) {
      console.warn('Erro ao subir foto no Supabase:', e);
    }
  };

  // Upload em lote (múltiplos arquivos)
  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const dataUrl = await readFileAsDataURL(file);
          newUrls.push(dataUrl);
        }
      }
      const updated = [...images, ...newUrls].slice(0, maxImages);
      onChange(updated);

      // Upload background para Supabase
      if (autoUploadToSupabase) {
        newUrls.forEach((url, idx) => {
          const overallIndex = images.length + idx;
          pushSingleToSupabase(url, overallIndex, overallIndex === 0);
        });
      }
    } catch (err) {
      console.error('Erro ao ler arquivos:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const dataUrl = await readFileAsDataURL(file);
          newUrls.push(dataUrl);
        }
      }
      const updated = [...images, ...newUrls].slice(0, maxImages);
      onChange(updated);

      if (autoUploadToSupabase) {
        newUrls.forEach((url, idx) => {
          const overallIndex = images.length + idx;
          pushSingleToSupabase(url, overallIndex, overallIndex === 0);
        });
      }
    } catch (err) {
      console.error('Erro ao ler arquivos soltos:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Mover foto para a posição 0 (Tornar Capa Principal)
  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  // Mover para a esquerda (subir prioridade)
  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const newArr = [...images];
    const temp = newArr[index - 1];
    newArr[index - 1] = newArr[index];
    newArr[index] = temp;
    onChange(newArr);
  };

  // Mover para a direita (descer prioridade)
  const handleMoveRight = (index: number) => {
    if (index === images.length - 1) return;
    const newArr = [...images];
    const temp = newArr[index + 1];
    newArr[index + 1] = newArr[index];
    newArr[index] = temp;
    onChange(newArr);
  };

  // Remover foto individual
  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  // Adicionar foto por link URL
  const handleAddUrl = () => {
    if (urlDraft.trim()) {
      onChange([...images, urlDraft.trim()]);
      setUrlDraft('');
      setShowUrlAdd(false);
    }
  };

  // Atualizar foto cortada
  const handleCropComplete = (croppedDataUrl: string) => {
    if (croppingIndex === null) return;
    const newArr = [...images];
    newArr[croppingIndex] = croppedDataUrl;
    onChange(newArr);
    pushSingleToSupabase(croppedDataUrl, croppingIndex, croppingIndex === 0);
    setCroppingIndex(null);
  };

  return (
    <div className="space-y-4">
      
      {/* Cabeçalho do Gerenciador de Galeria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
        <div>
          <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {description || 'Adicione fotos em alta qualidade. Arraste para reordenar ou use as setas para definir a capa principal.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700">
            {images.length} {images.length === 1 ? 'foto cadastrada' : 'fotos cadastradas'}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Fotos</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFilesSelect}
        className="hidden"
      />

      {/* Grade de Fotos Existentes com Controles de Posição & Corte */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {images.map((imgUrl, index) => {
            const isCover = index === 0;
            return (
              <div
                key={index}
                className={`group relative rounded-2xl overflow-hidden border-2 bg-stone-950 shadow-sm flex flex-col justify-between transition-all ${
                  isCover 
                    ? 'border-amber-500 ring-2 ring-amber-400/40' 
                    : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                {/* Imagem */}
                <div className="aspect-[4/3] w-full relative overflow-hidden bg-stone-900">
                  <img
                    src={imgUrl}
                    alt={`Foto ${index + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badge de Capa ou Posição */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {isCover ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Capa</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-sm text-stone-300 text-[10px] font-mono font-bold">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Ações Rápidas no Hover */}
                  <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={() => setCroppingIndex(index)}
                      className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow cursor-pointer"
                      title="Cortar e enquadrar esta foto"
                    >
                      <Crop className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(imgUrl)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white transition shadow cursor-pointer"
                      title="Visualizar em tamanho grande"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow cursor-pointer"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Barra Inferior de Ordenação */}
                <div className="p-2 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => handleMakeCover(index)}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      title="Tornar esta a foto principal da capa"
                    >
                      <Star className="w-3 h-3" />
                      <span>Capa</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-medium">Foto Principal</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveLeft(index)}
                      className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Mover para a esquerda"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => handleMoveRight(index)}
                      className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="Mover para a direita"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {/* Botão de Adicionar Mais na Grade */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-white flex flex-col items-center justify-center gap-2 cursor-pointer transition p-4 text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-500 text-amber-600 group-hover:text-stone-950 flex items-center justify-center transition">
              <Plus className="w-5 h-5" />
            </div>
            <strong className="text-xs font-bold text-stone-800">
              Mais Fotos
            </strong>
            <span className="text-[10px] text-stone-500">
              Arraste ou clique
            </span>
          </div>
        </div>
      ) : (
        /* Zona Vazia de Drag & Drop para a Galeria */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragOver 
              ? 'border-amber-500 bg-amber-50/50 scale-[1.01]' 
              : 'border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-white'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <strong className="block text-sm font-bold text-stone-900">
              Nenhuma foto cadastrada para este quarto ainda
            </strong>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Clique para selecionar múltiplas fotos do seu dispositivo ou arraste e solte seus arquivos diretamente aqui.
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold shadow-md transition"
          >
            Enviar Fotos do Computador
          </button>
        </div>
      )}

      {/* Adicionar via Link URL Opcional */}
      <div className="pt-2">
        {!showUrlAdd ? (
          <button
            type="button"
            onClick={() => setShowUrlAdd(true)}
            className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1 cursor-pointer transition"
          >
            <LinkIcon className="w-3 h-3 text-stone-400" />
            <span>Adicionar foto por link URL da web</span>
          </button>
        ) : (
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-stone-600 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-amber-500" />
                <span>Inserir URL da Imagem</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlAdd(false)}
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
                onClick={handleAddUrl}
                className="px-3.5 py-2 rounded-lg bg-stone-900 text-amber-300 text-xs font-bold hover:bg-stone-800 transition cursor-pointer"
              >
                Adicionar à Galeria
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Corte da Foto Selecionada */}
      {croppingIndex !== null && images[croppingIndex] && (
        <ImageCropperModal
          isOpen={croppingIndex !== null}
          imageSrc={images[croppingIndex]}
          title={`Cortar & Enquadrar Foto #${croppingIndex + 1}`}
          defaultAspectRatio={4 / 3}
          onClose={() => setCroppingIndex(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Modal de Preview Grande */}
      {previewModalUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 p-2">
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/80 text-white hover:bg-stone-800 transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="Visualização Ampliada"
              className="max-h-[85vh] w-auto object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}

    </div>
  );
};
