// Task 4.4 & 5.4: ServiceFactory for storage and AI service selection
import { IStorageService } from './storage/IStorageService';
import { MockStorageService } from './storage/MockStorageService';
import { S3StorageService } from './storage/S3StorageService';
import { IAIAnalysisService } from './ai/IAIAnalysisService';
import { MockBedrockService } from './ai/MockBedrockService';
import { BedrockService } from './ai/BedrockService';

export class ServiceFactory {
  private static storageService: IStorageService | null = null;
  private static aiService: IAIAnalysisService | null = null;

  static getStorageService(): IStorageService {
    if (!this.storageService) {
      const useMock = process.env.USE_MOCK_STORAGE !== 'false';

      if (useMock) {
        console.log('📦 Using MockStorageService');
        this.storageService = new MockStorageService();
      } else {
        console.log('🪣 Using S3StorageService');
        this.storageService = new S3StorageService();
      }
    }
    return this.storageService;
  }

  static getAIService(): IAIAnalysisService {
    if (!this.aiService) {
      const useMock = process.env.USE_MOCK_BEDROCK !== 'false';

      if (useMock) {
        console.log('🤖 Using MockBedrockService');
        this.aiService = new MockBedrockService();
      } else {
        console.log('🤖 Using BedrockService (Amazon Nova)');
        this.aiService = new BedrockService();
      }
    }
    return this.aiService;
  }
}
