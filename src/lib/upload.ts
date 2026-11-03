import { supabase } from './supabase'

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4']
const MAX = 20 * 1024 * 1024

export function validateFile(file: File, maxBytes = MAX) {
  if (!ALLOWED.includes(file.type)) throw new Error('Unsupported file type.')
  if (file.size > maxBytes) throw new Error('File is too large.')
}

// Uploads a file into {bucket}/{uid}/{random}.ext and returns its public URL.
// Storage RLS requires the first folder segment to equal the caller's uid.
export async function uploadFile(
  bucket: string,
  userId: string,
  file: File,
  maxBytes?: number
): Promise<string> {
  validateFile(file, maxBytes)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
