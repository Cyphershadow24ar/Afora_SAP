// Task 4.1: IStorageService interface and ImageUploadResult type
import { ImageUploadResult } from '@/lib/types';

export interface IStorageService {
  uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]>;
  getImageUrl(key: string): Promise<string>;
  deleteImages(keys: string[]): Promise<void>;
}
