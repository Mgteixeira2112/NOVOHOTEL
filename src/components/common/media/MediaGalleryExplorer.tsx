import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Database,
  Sparkles,
  Info,
  X,
  Plus,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { MediaCategory, MediaUploadRecord } from '../../../types';
import { 
  getHotelImages, 
  deleteHotelImage, 
  uploadHotelImage, 
  extractAllLocalImages 
} from '../../../services/mediaService';
import { useHotel } from '../../../context/HotelContext';
import { formatFileSize, readFileAsDataURL } from '../../../utils/imageHelper';

interface MediaGalleryExplorerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectImage?: (url: string, record?: MediaUploadRecord) => void;
  filterCategory?: MediaCategory | 'todas';
  initialRoomId?: string;
  isModal?: boolean;
}

export const MediaGalleryExplorer: React.FC<MediaGalleryExplorerProps> = ({
  isOpen = true,
  onClose,
  onSelectImage,
  filterCategory = 'todas',
  initialRoomId,
  isModal = false,
}) => {
  const { hotelConfig, rooms, users } = useHotel();
  const [mediaList, setMediaList] = useState<MediaUploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | 'todas'>(filterCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<MediaUploadRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('quarto');
  const [uploadRoomId, setUploadRoomId] = useState<string>(initialRoomId || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Carregar mídias do Supabase e mesclar com locais
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const remoteRecords = await getHotelImages();
      const localRecords = extractAllLocalImages(hotelConfig, rooms, users);

      // Combinar sem duplicar por URL
      const combinedMap = new Map<string, MediaUploadRecord>();
      
      // 1. Inserir locais como base
      localRecords.forEach((rec) => {
        if (rec.url) combinedMap.set(rec.url, rec);
      });

      // 2. Sobrescrever / adicionar remotos do Supabase
      remoteRecords.forEach((rec) => {
        if (rec.url) combinedMap.set(rec.url, rec);
      });

      setMediaList(Array.from(combinedMap.values()));
    } catch (err) {
      console.warn('Erro ao listar imagens:', err);
      // Fallback para locais
      const localRecords = extractAllLocalImages(hotelConfig, rooms, users);
      setMediaList(localRecords);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [hotelConfig, rooms, users]);

  // Filtragem
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      const matchCat = selectedCategory === 'todas' || item.category === selectedCategory;
      const matchQuery = 
        !searchQuery.trim() ||
        (item.file_name && item.file_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.uploaded_by && item.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [mediaList, selectedCategory, searchQuery]);

  // Copiar URL pública
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Excluir imagem
  const handleDelete = async (item: MediaUploadRecord) => {
    if (!confirm(`Deseja realmente remover esta foto ("${item.file_name || 'Imagem'}") do Supabase?`)) {
      return;
    }
    
    setMediaList((prev) => prev.filter((m) => m.id !== item.id));
    if (previewItem?.id === item.id) setPreviewItem(null);

    try {
      await deleteHotelImage(item.id, item.storage_path);
    } catch (e) {
      console.warn('Erro ao deletar:', e);
    }
  };

  // Upload manual direto
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadFeedback('Enviando para o Supabase Storage...');

    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await readFileAsDataURL(file);
        const res = await uploadHotelImage({
          fileOrDataUrl: dataUrl,
          fileName: file.name,
          category: uploadCategory,
          roomId: uploadRoomId || null,
        });

        if (res.success && res.record) {
          count++;
          setMediaList((prev) => [res.record!, ...prev]);
        }
      } catch (err) {
        console.error('Erro no upload direto:', err);
      }
    }

    setIsUploading(false);
    setUploadFeedback(`${count} foto(s) enviada(s) e salvas no banco Supabase!`);
    setTimeout(() => setUploadFeedback(null), 3500);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categories: Array<{ key: MediaCategory | 'todas'; label: string; count: number }> = [
    { key: 'todas', label: 'Todas as Fotos', count: mediaList.length },
    { key: 'quarto', label: 'Quartos', count: mediaList.filter((m) => m.category === 'quarto').length },
    { key: 'hero', label: 'Capa / Hero', count: mediaList.filter((m) => m.category === 'hero').length },
    { key: 'sobre', label: 'Sobre o Hotel', count: mediaList.filter((m) => m.category === 'sobre').length },
    { key: 'logo', label: 'Logotipo', count: mediaList.filter((m) => m.category === 'logo').length },
    { key: 'avatar', label: 'Avatares / Equipe', count: mediaList.filter((m) => m.category === 'avatar').length },
    { key: 'depoimento', label: 'Depoimentos', count: mediaList.filter((m) => m.category === 'depoimento').length },
    { key: 'comodidade', label: 'Comodidades', count: mediaList.filter((m) => m.category === 'comodidade').length },
    { key: 'outro', label: 'Outras', count: mediaList.filter((m) => m.category === 'outro').length },
  ];

  const content = (
    <div className="space-y-6">
      
      {/* Topo / Barra de Ações & Upload */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold font-serif-luxury text-white">
                  Banco de Mídias & Armazenamento Supabase
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" />
                  Bucket: hotel-media
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[10px] font-bold border border-stone-700">
                  {mediaList.length} arquivos catalogados
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Todas as fotos enviadas por upload ficam permanentemente armazenadas no Storage e registradas na tabela <code className="text-amber-300 font-mono">media_uploads</code> do Supabase.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadMedia}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Enviando...' : 'Fazer Upload de Fotos'}</span>
            </button>
          </div>
        </div>

        {/* Linha de Configuração do Upload Manual */}
        <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-stone-400 font-medium">Configurar destino do próximo upload:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 text-[11px]">Categoria:</span>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as MediaCategory)}
              className="bg-stone-800 text-stone-200 text-xs rounded-lg px-2.5 py-1 border border-stone-700 focus:outline-none focus:border-amber-500"
            >
              <option value="quarto">Quarto / Acomodação</option>
              <option value="hero">Capa / Hero</option>
              <option value="sobre">Sobre o Hotel</option>
              <option value="logo">Logotipo</option>
              <option value="avatar">Avatar / Equipe</option>
              <option value="depoimento">Depoimento</option>
              <option value="comodidade">Comodidade</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {uploadCategory === 'quarto' && rooms.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 text-[11px]">Quarto:</span>
              <select
                value={uploadRoomId}
                onChange={(e) => setUploadRoomId(e.target.value)}
                className="bg-stone-800 text-stone-200 text-xs rounded-lg px-2.5 py-1 border border-stone-700 focus:outline-none focus:border-amber-500"
              >
                <option value="">(Nenhum / Geral)</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Quarto {r.numero} — {r.nome || `Acomodação`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {uploadFeedback && (
            <span className="text-emerald-400 text-xs font-semibold animate-in fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {uploadFeedback}
            </span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleDirectUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Barra de Filtros por Categoria & Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Chips de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-stone-950 text-amber-400' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input de Busca */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* Grade de Fotos */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 space-y-3 shadow-sm">
          <ImageIcon className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
          <p className="text-sm font-semibold text-stone-700">Nenhuma foto encontrada nesta categoria.</p>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Faça upload de fotos ou configure as imagens nas abas de Acomodações e Landing Page.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-stone-900 text-amber-300 text-xs font-bold inline-flex items-center gap-2 hover:bg-stone-800 transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Enviar Primeira Foto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredList.map((item) => {
            const isSupabaseHosted = Boolean(
              item.storage_path || (item.url && item.url.includes('supabase.co/storage'))
            );

            return (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Imagem com Hover Actions */}
                <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.file_name || 'Mídia do Hotel'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Badge de Categoria */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                    {isSupabaseHosted && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-[8px] font-bold flex items-center gap-0.5 shadow-sm">
                        <Database className="w-2 h-2" />
                        Storage
                      </span>
                    )}
                  </div>

                  {/* Overlay de Ações Rápidas */}
                  <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      title="Visualizar em Tela Cheia e Metadados"
                      className="p-2 rounded-xl bg-white/90 hover:bg-white text-stone-900 shadow transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.url, item.id)}
                      title="Copiar Link Público da Foto"
                      className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 shadow transition cursor-pointer"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {onSelectImage && (
                      <button
                        type="button"
                        onClick={() => onSelectImage(item.url, item)}
                        title="Selecionar esta foto"
                        className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition cursor-pointer"
                      >
                        Selecionar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Excluir do Banco de Dados"
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rodapé do Card com Dados Técnicos */}
                <div className="p-2.5 space-y-1 bg-stone-50 border-t border-stone-100">
                  <p className="text-[11px] font-bold text-stone-800 truncate" title={item.file_name || 'Imagem'}>
                    {item.file_name || 'Imagem sem título'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-500">
                    <span>
                      {item.width && item.height ? `${item.width}×${item.height}` : item.aspect_ratio || '16:9'}
                    </span>
                    {item.file_size ? (
                      <span className="font-mono">{formatFileSize(item.file_size)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Visualização Ampliada & Metadados SQL */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto Ampliada */}
            <div className="md:w-3/5 bg-black flex items-center justify-center p-4 min-h-[300px]">
              <img
                src={previewItem.url}
                alt={previewItem.file_name}
                className="max-h-[75vh] w-auto object-contain rounded-2xl"
              />
            </div>

            {/* Metadados e Informações do Registro SQL */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-4 text-stone-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    {previewItem.category}
                  </span>
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="p-1.5 rounded-full bg-stone-800 text-stone-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-base font-bold text-white break-all">
                  {previewItem.file_name || 'Foto sem nome'}
                </h4>

                <div className="space-y-2 text-xs text-stone-300 font-mono bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                  <div className="flex justify-between">
                    <span className="text-stone-500">ID da Linha:</span>
                    <span className="text-amber-400 font-bold truncate max-w-[160px]">{previewItem.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Bucket:</span>
                    <span className="text-emerald-400">hotel-media</span>
                  </div>
                  {previewItem.storage_path && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Storage Path:</span>
                      <span className="text-stone-300 truncate max-w-[160px]">{previewItem.storage_path}</span>
                    </div>
                  )}
                  {previewItem.width && previewItem.height && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Dimensões:</span>
                      <span>{previewItem.width} × {previewItem.height} px</span>
                    </div>
                  )}
                  {previewItem.file_size && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Tamanho:</span>
                      <span>{formatFileSize(previewItem.file_size)}</span>
                    </div>
                  )}
                  {previewItem.created_at && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Data de Envio:</span>
                      <span>{new Date(previewItem.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewItem.url, previewItem.id)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow transition cursor-pointer"
                >
                  {copiedId === previewItem.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>URL Pública Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar URL Pública do Supabase</span>
                    </>
                  )}
                </button>

                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <span>Abrir em Nova Aba</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(previewItem)}
                  className="w-full py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir do Banco de Dados</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isModal) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
        <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-3xl overflow-y-auto p-6 sm:p-8 shadow-2xl border border-stone-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
            <h3 className="text-xl font-bold font-serif-luxury text-stone-900">
              Galeria de Mídias & Fotos Supabase
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
