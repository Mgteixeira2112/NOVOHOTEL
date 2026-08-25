import React, { useState, useRef } from 'react';
import { 
  Camera, 
  UploadCloud, 
  Crop, 
  Trash2, 
  Check, 
  User, 
  Sparkles,
  Link as LinkIcon,
  Database,
  RefreshCw
} from 'lucide-react';
import { readFileAsDataURL } from '../../../utils/imageHelper';
import { ImageCropperModal } from './ImageCropperModal';
import { uploadHotelImage } from '../../../services/mediaService';
import { MediaCategory } from '../../../types';

interface AvatarUploaderProps {
  label?: string;
  value?: string;
  onChange: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  presets?: string[];
  description?: string;
  category?: MediaCategory;
  userName?: string;
  autoUploadToSupabase?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  label = 'Foto de Perfil / Avatar',
  value,
  onChange,
  size = 'lg',
  shape = 'circle',
  presets,
  description,
  category = 'avatar',
  userName,
  autoUploadToSupabase = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pushToSupabase = async (url: string) => {
    if (!autoUploadToSupabase || !url) return;
    setIsUploading(true);
    try {
      const res = await uploadHotelImage({
        fileOrDataUrl: url,
        category,
        uploadedBy: userName || null,
        aspectRatio: '1:1',
      });
      if (res.success && res.url && res.url.startsWith('http') && res.url !== value) {
        onChange(res.url);
      }
    } catch (e) {
      console.warn('Erro ao subir avatar no Supabase:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataURL(file);
      onChange(dataUrl);
      setIsCropperOpen(true);
    } catch (err) {
      console.error('Erro ao ler foto de avatar:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }[size];

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div className="space-y-3">
      {label && (
        <div>
          <label className="block text-xs font-bold text-stone-900">{label}</label>
          {description && <p className="text-[11px] text-stone-500 mt-0.5">{description}</p>}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        {/* Preview do Avatar */}
        <div className={`relative ${sizeClasses} ${roundedClass} bg-stone-800 border-2 border-amber-500/80 overflow-hidden flex-shrink-0 shadow-md group`}>
          {value ? (
            <img src={value} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <User className="w-1/2 h-1/2" />
            </div>
          )}

          {/* Botão de Enquadramento no Hover */}
          {value && (
            <div 
              onClick={() => setIsCropperOpen(true)}
              className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-amber-400"
              title="Cortar e enquadrar avatar"
            >
              <Crop className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Enviar Foto</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Ajustar enquadramento 1:1"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Cortar</span>
              </button>
            )}

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                title="Remover foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <span className="text-[10px] text-stone-500 block">
            Formato quadrado 1:1 ideal. Suporta JPG, PNG e WebP.
          </span>
        </div>
      </div>

      {/* Presets Rápidos de Avatar (Se houver) */}
      {presets && presets.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Ou escolha um modelo pronto:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {presets.map((presetUrl, idx) => {
              const isSelected = value === presetUrl;
              return (
                <div
                  key={idx}
                  onClick={() => onChange(presetUrl)}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-amber-500 ring-2 ring-amber-400 shadow' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cropper Modal 1:1 */}
      {isCropperOpen && value && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={value}
          title="Ajustar Enquadramento da Foto"
          defaultAspectRatio={1}
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
