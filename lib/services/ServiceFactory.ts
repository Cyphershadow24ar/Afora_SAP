// Task 4.4 & 5.4: ServiceFactory for storage and AI service selection
import { IStorageService } from './storage/IStorageService';
import { MockStorageService } from './storage/MockStorageService';
import { IAIAnalysisService } from './ai/IAIAnalysisService';
import { MockBedrockService } from './ai/MockBedrockService';

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
        // Task 4.3 skipped per instructions - would initialize S3StorageService here
        throw new Error('Real S3 storage service not implemented in this build');
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
        // Task 5.3 skipped per instructions - would initialize BedrockService here
        throw new Error('Real Bedrock service not implemented in this build');
      }
    }
    return this.aiService;
  }
}
