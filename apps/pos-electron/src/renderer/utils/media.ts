import { logger } from './logger';

export function isLocalMedia(path: string): boolean {
  if (!path) return false;
  return !path.startsWith('http') && !path.startsWith('file://') && !path.startsWith('data:');
}

export function isRemoteMedia(path: string): boolean {
  if (!path) return false;
  return path.startsWith('http');
}

export async function getMediaUrl(path: string): Promise<string | null> {
  if (!path) return null;

  if (isRemoteMedia(path) || path.startsWith('file://') || path.startsWith('data:')) {
    return path;
  }

  if (isLocalMedia(path)) {
    try {
      return await window.api.media.getUrl(path);
    } catch (error) {
      logger.error('Failed to get media URL', 'media-get-url', { path, error });
      return null;
    }
  }

  return null;
}

export async function prepareMediaForSync(localPath: string): Promise<{
  data: string;
  filename: string;
  mimeType: string;
} | null> {
  if (!localPath || !isLocalMedia(localPath)) {
    return null;
  }

  try {
    const buffer = await window.api.media.get(localPath);
    const base64 = buffer.toString('base64');

    const ext = localPath.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
    }

    return {
      data: base64,
      filename: localPath,
      mimeType,
    };
  } catch (error) {
    logger.error('Failed to prepare media for sync', 'media-prepare-sync', { localPath, error });
    return null;
  }
}

export function handleSyncedMedia(
  localPath: string,
  remoteUrl: string,
): {
  picture: string;
  pictureUrl: string;
} {
  return {
    picture: localPath,
    pictureUrl: remoteUrl,
  };
}

export async function getBestMediaUrl(localPath?: string, remoteUrl?: string): Promise<string | null> {
  if (remoteUrl && isRemoteMedia(remoteUrl)) {
    return remoteUrl;
  }

  if (localPath) {
    return await getMediaUrl(localPath);
  }

  return null;
}

export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
}
