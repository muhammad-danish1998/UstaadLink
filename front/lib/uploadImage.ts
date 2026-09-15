import { createClient } from '@/lib/supabase/client';

/**
 * Ultra-lightweight image compression for profile avatars.
 * Resizes to a maximum dimension of 280px and compresses with WebP / JPEG.
 * Reduces file sizes from multiple megabytes down to ~10KB-25KB without visible quality loss.
 */
export async function compressImage(
  file: File,
  maxDim = 280,
  quality = 0.72
): Promise<{ blob: Blob; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context is unavailable'));
        }

        // Apply high-quality smooth interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine optimal format (WebP preferred for maximum compression)
        let mimeType = 'image/webp';
        let testDataUrl = '';
        try {
          testDataUrl = canvas.toDataURL('image/webp', quality);
          if (!testDataUrl.startsWith('data:image/webp')) {
            mimeType = 'image/jpeg';
          }
        } catch {
          mimeType = 'image/jpeg';
        }

        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const origSizeKb = (file.size / 1024).toFixed(1);
              const compSizeKb = (blob.size / 1024).toFixed(1);
              console.log(
                `Profile photo compressed: ${origSizeKb} KB -> ${compSizeKb} KB (${mimeType})`
              );
              resolve({ blob, dataUrl, mimeType });
            } else {
              // Fallback to jpeg blob
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob) {
                    resolve({ blob: fallbackBlob, dataUrl, mimeType: 'image/jpeg' });
                  } else {
                    reject(new Error('Image blob conversion failed'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          mimeType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a teacher profile picture to Supabase Storage 'avatars' bucket.
 * Automatically applies heavy compression to guarantee fast loading and minimal storage footprint.
 * Returns public CDN URL or falls back to lightweight compressed Base64 dataUrl.
 */
export async function uploadTeacherAvatar(file: File, prefix = 'teacher'): Promise<string> {
  try {
    const { blob, dataUrl, mimeType } = await compressImage(file, 280, 0.72);
    const supabase = createClient();
    const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: mimeType,
        cacheControl: '31536000', // 1-year immutable cache
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage notice, using compressed dataUrl:', error.message);
      return dataUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl || dataUrl;
  } catch (err) {
    console.error('Error during image upload, using fallback:', err);
    try {
      const { dataUrl } = await compressImage(file, 240, 0.65);
      return dataUrl;
    } catch {
      return '';
    }
  }
}
