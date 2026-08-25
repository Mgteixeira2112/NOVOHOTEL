import { MediaUploadRecord, MediaCategory, HotelConfig, Quarto, Usuario } from '../types';
import { 
  uploadImageToSupabaseStorage, 
  fetchMediaUploadsFromSupabase, 
  deleteMediaUploadFromSupabase,
  upsertMediaUploadToSupabase
} from './supabase';

/**
 * Faz upload de imagem para o Supabase Storage (bucket hotel-media)
 * e salva os metadados completos na tabela SQL 'media_uploads'.
 */
export async function uploadHotelImage({
  fileOrDataUrl,
  fileName,
  category,
  roomId = null,
  isCover = false,
  sortOrder = 0,
  width = null,
  height = null,
  aspectRatio = null,
  cropData = null,
  uploadedBy = null,
}: {
  fileOrDataUrl: File | Blob | string;
  fileName?: string;
  category: MediaCategory;
  roomId?: string | null;
  isCover?: boolean;
  sortOrder?: number;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  cropData?: Record<string, any> | null;
  uploadedBy?: string | null;
}): Promise<{ success: boolean; url: string; record?: MediaUploadRecord; error?: string }> {
  return await uploadImageToSupabaseStorage({
    fileOrDataUrl,
    fileName,
    category,
    roomId,
    isCover,
    sortOrder,
    width,
    height,
    aspectRatio,
    cropData,
    uploadedBy,
  });
}

/**
 * Busca todas as fotos salvas na tabela media_uploads do Supabase
 */
export async function getHotelImages(
  category?: MediaCategory,
  roomId?: string
): Promise<MediaUploadRecord[]> {
  const result = await fetchMediaUploadsFromSupabase(category, roomId);
  return result || [];
}

/**
 * Remove uma foto do Supabase Storage e da tabela media_uploads
 */
export async function deleteHotelImage(
  id: string,
  storagePath?: string | null
): Promise<boolean> {
  return await deleteMediaUploadFromSupabase(id, storagePath);
}

/**
 * Atualiza metadados de uma imagem na tabela media_uploads
 */
export async function updateHotelImageRecord(
  record: MediaUploadRecord
): Promise<boolean> {
  return await upsertMediaUploadToSupabase(record);
}

/**
 * Extrai todas as imagens existentes na base local (Hero, Sobre, Logos, Quartos, Avatares)
 * para catalogar na tabela media_uploads do Supabase durante a exportação/seed.
 */
export function extractAllLocalImages(
  hotelConfig: HotelConfig,
  rooms: Quarto[],
  users: Usuario[]
): MediaUploadRecord[] {
  const records: MediaUploadRecord[] = [];
  const now = new Date().toISOString();

  // 1. Imagens do Hotel / Landing Page
  if (hotelConfig.logo_url) {
    records.push({
      id: 'media_cfg_logo',
      file_name: 'logo_hotel.png',
      url: hotelConfig.logo_url,
      category: 'logo',
      sort_order: 0,
      mime_type: 'image/png',
      created_at: now,
      updated_at: now,
    });
  }

  if (hotelConfig.hero_bg_url) {
    records.push({
      id: 'media_cfg_hero',
      file_name: 'hero_background.jpg',
      url: hotelConfig.hero_bg_url,
      category: 'hero',
      is_cover: true,
      sort_order: 0,
      aspect_ratio: '21:9',
      mime_type: 'image/jpeg',
      created_at: now,
      updated_at: now,
    });
  }

  if (hotelConfig.sobre_foto_url) {
    records.push({
      id: 'media_cfg_sobre',
      file_name: 'sobre_hotel.jpg',
      url: hotelConfig.sobre_foto_url,
      category: 'sobre',
      sort_order: 0,
      aspect_ratio: '16:9',
      mime_type: 'image/jpeg',
      created_at: now,
      updated_at: now,
    });
  }

  // Galeria de Depoimentos
  if (hotelConfig.depoimentos && Array.isArray(hotelConfig.depoimentos)) {
    hotelConfig.depoimentos.forEach((dep, idx) => {
      if (dep.avatar) {
        records.push({
          id: `media_depoimento_${dep.id || idx}`,
          file_name: `avatar_depoimento_${dep.nome || idx}.jpg`,
          url: dep.avatar,
          category: 'depoimento',
          sort_order: idx,
          aspect_ratio: '1:1',
          mime_type: 'image/jpeg',
          created_at: now,
          updated_at: now,
        });
      }
    });
  }

  // Galeria dos Quartos
  if (rooms && Array.isArray(rooms)) {
    rooms.forEach((room) => {
      if (room.fotos && Array.isArray(room.fotos)) {
        room.fotos.forEach((fotoUrl, fIdx) => {
          if (fotoUrl && fotoUrl.trim()) {
            records.push({
              id: `media_room_${room.id}_${fIdx}`,
              file_name: `quarto_${room.numero}_foto_${fIdx + 1}.jpg`,
              url: fotoUrl,
              category: 'quarto',
              room_id: room.id,
              is_cover: fIdx === 0,
              sort_order: fIdx,
              aspect_ratio: '16:9',
              mime_type: 'image/jpeg',
              created_at: now,
              updated_at: now,
            });
          }
        });
      }
    });
  }

  // Avatares dos Usuários / Equipe
  if (users && Array.isArray(users)) {
    users.forEach((user, uIdx) => {
      if (user.avatar && user.avatar.trim()) {
        records.push({
          id: `media_user_${user.id || uIdx}`,
          file_name: `avatar_usuario_${user.nome || uIdx}.jpg`,
          url: user.avatar,
          category: 'avatar',
          sort_order: uIdx,
          aspect_ratio: '1:1',
          mime_type: 'image/jpeg',
          uploaded_by: user.nome,
          created_at: now,
          updated_at: now,
        });
      }
    });
  }

  return records;
}
