import { createClient } from './client';

/**
 * Uploads an array of File objects to Supabase Storage and returns their public URLs.
 * @param files Array of local files to upload
 * @param bucketName Name of the Supabase storage bucket (defaults to 'homestay-images')
 */
export async function uploadImagesToSupabase(files: File[], bucketName = 'homestay-images'): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    // Generate a unique filename using timestamp and a random string
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload the file to the Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error(`Error uploading file ${file.name} to Supabase Storage:`, error);
      throw new Error(`Không thể tải ảnh ${file.name} lên máy chủ lưu trữ: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    urls.push(publicUrl);
  }

  return urls;
}
