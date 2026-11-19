import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadImage = async (req, res, next) => {
  try {
    const { image, name = 'upload' } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'No image data provided. Please send a valid base64 image data URL.',
      });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return res.status(200).json({
          success: true,
          url: image,
          message: 'External image URL accepted.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected a base64 Data URL (e.g., data:image/jpeg;base64,...).',
      });
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];

    const supportedMimes = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };

    const extension = supportedMimes[mimeType];
    if (!extension) {
      return res.status(400).json({
        success: false,
        message: `Unsupported image type: ${mimeType}. Allowed formats: JPG, PNG, WebP, GIF, SVG.`,
      });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds maximum limit of 8MB.',
      });
    }

    const sanitizedName = String(name)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `${sanitizedName}-${uniqueSuffix}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5001';
    const fullUrl = `${protocol}://${host}/uploads/${filename}`;
    const relativeUrl = `/uploads/${filename}`;

    return res.status(201).json({
      success: true,
      url: fullUrl,
      relativeUrl,
      filename,
      size: buffer.length,
      mimeType,
      message: 'Image uploaded successfully.',
    });
  } catch (error) {
    next(error);
  }
};

