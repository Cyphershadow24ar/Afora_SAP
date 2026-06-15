// Central export file for all library components
export * from './types';
export { default as DatabaseService } from './db/connection';
export { ProductRepository } from './db/repositories/ProductRepository';
export { AnalysisRepository } from './db/repositories/AnalysisRepository';
export { initializeDatabase } from './db/init';
export { generateSeedData } from './db/seed';
export { ServiceFactory } from './services/ServiceFactory';
export { RecommendationEngine } from './services/RecommendationEngine';
export type { IStorageService } from './services/storage/IStorageService';
export type { IAIAnalysisService } from './services/ai/IAIAnalysisService';
