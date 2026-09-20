import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type {
  IImageStorage,
  ImageUpload,
} from '../../domain/interfaces/image-storage.interface.js';

@Injectable()
export class CloudinaryService implements IImageStorage {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(file: ImageUpload): Promise<string> {
    this.assertConfigured();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'catalogo' },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              new ServiceUnavailableException(
                'No se pudo subir la imagen a Cloudinary',
              ),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  private assertConfigured(): void {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException(
        'Cloudinary no está configurado',
      );
    }
  }
}
