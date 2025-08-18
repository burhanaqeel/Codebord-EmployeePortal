import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer to Cloudinary (images/documents). Returns secure URL
export async function uploadImage(file: Buffer, folder: string = 'codebord-employees'): Promise<string> {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          // Allow common images and document formats used in this app
          allowed_formats: ['jpg','jpeg','png','webp','gif','pdf','doc','docx','txt'],
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file);
    });

    return (result as any).secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
}

// Delete asset from Cloudinary by publicId (e.g., folder/name)
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'ok' || result.result === 'not found') return true;
    // Try raw type for documents
    const raw = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    return raw.result === 'ok' || raw.result === 'not found';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

// Extract Cloudinary public ID from a secure URL. Returns folder/name without extension
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.startsWith('http')) return null;
    // Cloudinary URL pattern: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/<folder>/<name>.<ext>
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    // find the index of 'upload' and take the path after version segment
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1) return null;
    // parts[uploadIndex + 1] might be version like v169...
    const after = parts.slice(uploadIndex + 1);
    // drop leading version segment starting with 'v'
    const withoutVersion = after[0]?.startsWith('v') ? after.slice(1) : after;
    if (withoutVersion.length === 0) return null;
    const last = withoutVersion[withoutVersion.length - 1];
    const lastNoExt = last.includes('.') ? last.substring(0, last.lastIndexOf('.')) : last;
    const pathParts = withoutVersion.slice(0, -1).concat(lastNoExt);
    return pathParts.join('/');
  } catch {
    return null;
  }
}

// Get image URL with transformations
export function getImageUrl(publicId: string, transformations: any = {}): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations
  });
}

export default cloudinary;
