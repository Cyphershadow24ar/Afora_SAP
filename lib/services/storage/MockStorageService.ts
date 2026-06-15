// Task 4.2: MockStorageService with in-memory storage
import { IStorageService } from './IStorageService';
import { ImageUploadResult } from '@/lib/types';

export class MockStorageService implements IStorageService {
  private inMemoryStore: Map<string, string> = new Map();

  async uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]> {
    const uploadPromises = images.map(async (image, index) => {
      const extension = this.getExtension(image.type);
      const key = `mock-analyses/${prefix}/image-${index}.${extension}`;

      // Convert File to base64 data URL
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${image.type};base64,${base64}`;

      // Store in memory
      this.inMemoryStore.set(key, dataUrl);

      return {
        key,
        url: dataUrl, // Return data URL that can be displayed directly in browser
        size: image.size,
      };
    });

    return await Promise.all(uploadPromises);
  }

  async getImageUrl(key: string): Promise<string> {
    const url = this.inMemoryStore.get(key);
    if (!url) {
      throw new Error(`Image not found: ${key}`);
    }
    return url;
  }

  async deleteImages(keys: string[]): Promise<void> {
    keys.forEach((key) => this.inMemoryStore.delete(key));
  }

  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mimeType] || 'jpg';
  }
}
