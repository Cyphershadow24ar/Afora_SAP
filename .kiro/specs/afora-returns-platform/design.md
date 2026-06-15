# Design Document: Afora Returns Platform

## Overview

The Afora Returns Platform is an AI-powered warehouse returns processing system designed for Amazon HackOn Season 6. It enables warehouse workers to scan returned products, capture images, receive AI-driven condition assessments, and get actionable recommendations (restock, resell, refurbish, donate). The platform demonstrates sustainable commerce through intelligent returns routing while maintaining a demo-friendly architecture with mock services for reliability.

The system uses a serverless Next.js architecture with MongoDB Atlas for product data, AWS S3 for image storage, and Amazon Bedrock for AI analysis. The MVP focuses on a streamlined workflow: barcode scan → product lookup → image capture → AI analysis → recommendation → dashboard tracking. The architecture supports both mock services (for demos) and real AWS services (for production) through a service abstraction layer.

## Architecture

### High-Level System Architecture

```mermaid
graph TD
    A[Warehouse Worker Browser] --> B[Next.js Frontend]
    B --> C[Next.js API Routes]
    C --> D[MongoDB Atlas]
    C --> E[Storage Service Layer]
    C --> F[AI Service Layer]
    C --> G[Recommendation Engine]
    E --> H[MockStorageService]
    E --> I[AWS S3]
    F --> J[MockBedrockService]
    F --> K[Amazon Bedrock]
    G --> L[Dashboard Service]
    
    style H fill:#f9f,stroke:#333
    style J fill:#f9f,stroke:#333
    style I fill:#9f9,stroke:#333
    style K fill:#9f9,stroke:#333
```

### Core Workflow Sequence

```mermaid
sequenceDiagram
    participant W as Worker
    participant F as Frontend
    participant API as API Routes
    participant DB as MongoDB
    participant S as Storage Service
    participant AI as AI Service
    participant R as Recommendation Engine
    
    W->>F: Access Landing Page
    F->>W: Display Scan Interface
    W->>F: Scan Barcode / Enter Manually
    F->>API: POST /api/products/lookup
    API->>DB: Query by barcode
    DB-->>API: Product Record
    API-->>F: Product Details
    F->>W: Display Product + Image Capture UI
    W->>F: Capture 3-5 Images
    F->>API: POST /api/analysis/upload
    API->>S: Upload Images
    S-->>API: Image URLs
    API->>AI: Analyze Images
    AI-->>API: Analysis Result
    API->>R: Generate Recommendation
    R-->>API: Recommendation
    API->>DB: Save Analysis Record
    API-->>F: Complete Result
    F->>W: Display Recommendation
    W->>F: View Dashboard
    F->>API: GET /api/dashboard
    API->>DB: Aggregate Stats
    DB-->>API: Dashboard Data
    API-->>F: Stats + Recent Items
    F->>W: Display Dashboard
```


## Frontend Architecture

### Component Hierarchy

```typescript
// Page Components
interface LandingPage {
  render(): JSX.Element
  navigateToScan(): void
}

interface ScanPage {
  barcodeScanner: BarcodeScanner
  manualEntry: ManualBarcodeEntry
  onScanComplete(barcode: string): void
}

interface ProductDetailsPage {
  product: ProductRecord
  imageCapture: ImageCaptureComponent
  onImagesSubmit(images: File[]): void
}

interface ResultPage {
  analysis: AnalysisResult
  recommendation: Recommendation
  navigateToDashboard(): void
  processAnother(): void
}

interface DashboardPage {
  stats: DashboardStats
  recentItems: AnalysisRecord[]
  refreshData(): void
}

// Core UI Components
interface BarcodeScanner {
  cameraPreview: HTMLVideoElement
  scannerConfig: Html5QrcodeConfig
  onScanSuccess(decodedText: string): void
  onScanError(error: string): void
  toggleManualEntry(): void
}

interface ImageCaptureComponent {
  capturedImages: File[]
  minImages: 3
  maxImages: 5
  maxFileSize: 10485760 // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
  captureFromCamera(): void
  uploadFromDevice(): void
  removeImage(index: number): void
  validateImages(): boolean
}

### State Management Strategy

```typescript
// React Context for Global State
interface AppState {
  currentBarcode: string | null
  currentProduct: ProductRecord | null
  capturedImages: File[]
  analysisResult: AnalysisResult | null
  recommendation: Recommendation | null
}

interface AppActions {
  setBarcode(barcode: string): void
  setProduct(product: ProductRecord): void
  addImage(image: File): void
  removeImage(index: number): void
  clearImages(): void
  setAnalysisResult(result: AnalysisResult): void
  setRecommendation(rec: Recommendation): void
  resetWorkflow(): void
}

// Local State per Component
// - BarcodeScanner: scanning state, error messages
// - ImageCapture: upload progress, validation errors
// - Dashboard: loading state, filter settings
```

### Routing Structure

```typescript
// Next.js App Router Structure
const routes = {
  '/': 'Landing Page',
  '/scan': 'Barcode Scan Page',
  '/product/[barcode]': 'Product Details & Image Capture',
  '/result/[analysisId]': 'Analysis Result & Recommendation',
  '/dashboard': 'Dashboard Statistics'
}
```


## Backend Architecture

### Service Layer Design

```typescript
// Storage Service Abstraction
interface IStorageService {
  uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]>
  getImageUrl(key: string): Promise<string>
  deleteImages(keys: string[]): Promise<void>
}

class MockStorageService implements IStorageService {
  private inMemoryStore: Map<string, string> // key -> base64 data URL
  
  async uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]> {
    // Convert to base64, store in memory, return mock URLs
  }
  
  async getImageUrl(key: string): Promise<string> {
    // Return base64 data URL from memory
  }
  
  async deleteImages(keys: string[]): Promise<void> {
    // Remove from memory
  }
}

class S3StorageService implements IStorageService {
  private s3Client: S3Client
  private bucketName: string
  
  async uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]> {
    // Upload to S3, return S3 URLs
  }
  
  async getImageUrl(key: string): Promise<string> {
    // Generate signed URL for S3 object
  }
  
  async deleteImages(keys: string[]): Promise<void> {
    // Delete objects from S3
  }
}

// AI Analysis Service Abstraction
interface IAIAnalysisService {
  analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult>
}

interface ProductContext {
  productName: string
  brand: string
  category: string
  originalPrice: number
}

interface AIAnalysisResult {
  conditionGrade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged'
  confidenceScore: number // 0-100
  defectsDetected: string[]
  analysisSummary: string
}

class MockBedrockService implements IAIAnalysisService {
  async analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult> {
    // Simulate AI analysis with deterministic mock logic
    // Base confidence on category: Electronics=85, Clothing=78, etc.
    // Random defect selection from predefined lists
    // Add 100-300ms delay to simulate API call
  }
}

class BedrockService implements IAIAnalysisService {
  private bedrockClient: BedrockRuntimeClient
  private modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0'
  
  async analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult> {
    // Fetch images as base64
    // Construct vision prompt with product context
    // Call Bedrock with images
    // Parse structured response into AIAnalysisResult
  }
}

// Service Factory Pattern
class ServiceFactory {
  private static storageService: IStorageService | null = null
  private static aiService: IAIAnalysisService | null = null
  
  static getStorageService(): IStorageService {
    if (!this.storageService) {
      const useMock = process.env.USE_MOCK_STORAGE === 'true'
      this.storageService = useMock 
        ? new MockStorageService() 
        : new S3StorageService()
    }
    return this.storageService
  }
  
  static getAIService(): IAIAnalysisService {
    if (!this.aiService) {
      const useMock = process.env.USE_MOCK_BEDROCK === 'true'
      this.aiService = useMock 
        ? new MockBedrockService() 
        : new BedrockService()
    }
    return this.aiService
  }
}
```

### Database Service Layer

```typescript
// MongoDB Connection Manager
class DatabaseService {
  private static client: MongoClient | null = null
  private static db: Db | null = null
  
  static async connect(): Promise<Db> {
    if (this.db) return this.db
    
    this.client = new MongoClient(process.env.MONGODB_URI!)
    await this.client.connect()
    this.db = this.client.db(process.env.MONGODB_DB_NAME || 'afora-returns')
    
    return this.db
  }
  
  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
    }
  }
}

// Repository Pattern for Data Access
class ProductRepository {
  private collection: Collection<ProductRecord>
  
  constructor(db: Db) {
    this.collection = db.collection('products')
  }
  
  async findByBarcode(barcode: string): Promise<ProductRecord | null> {
    return await this.collection.findOne({ barcode })
  }
  
  async seedProducts(products: ProductRecord[]): Promise<void> {
    await this.collection.insertMany(products)
  }
  
  async getAllProducts(): Promise<ProductRecord[]> {
    return await this.collection.find({}).toArray()
  }
}

class AnalysisRepository {
  private collection: Collection<AnalysisRecord>
  
  constructor(db: Db) {
    this.collection = db.collection('analyses')
  }
  
  async create(record: Omit<AnalysisRecord, '_id' | 'createdAt'>): Promise<AnalysisRecord> {
    const doc = {
      ...record,
      createdAt: new Date()
    }
    const result = await this.collection.insertOne(doc)
    return { ...doc, _id: result.insertedId }
  }
  
  async findById(id: string): Promise<AnalysisRecord | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) })
  }
  
  async getRecentAnalyses(limit: number = 100): Promise<AnalysisRecord[]> {
    return await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  }
  
  async getStatistics(): Promise<DashboardStats> {
    // Aggregation pipeline to compute counts and totals
  }
}
```


## MongoDB Schema Design

### Collections Overview

The database contains two primary collections:
- `products`: Product catalog seeded with 50 sample products
- `analyses`: Records of all processed return items

### Product Collection Schema

```typescript
interface ProductRecord {
  _id?: ObjectId
  barcode: string              // Unique identifier, indexed
  productId: string            // Internal product ID
  productName: string          // Display name
  brand: string                // Product brand
  category: 'Electronics' | 'Mobile Accessories' | 'Home & Kitchen' | 'Clothing' | 'Books'
  originalPrice: number        // Original retail price in USD
  description: string          // Product description
}

// Indexes
// - barcode: unique index for fast lookup
// - category: non-unique index for analytics

// Example Document
{
  "_id": ObjectId("..."),
  "barcode": "1234567890123",
  "productId": "PROD-001",
  "productName": "Wireless Bluetooth Headphones",
  "brand": "TechAudio",
  "category": "Electronics",
  "originalPrice": 79.99,
  "description": "Premium wireless headphones with active noise cancellation"
}
```


### Analysis Collection Schema

```typescript
interface AnalysisRecord {
  _id?: ObjectId
  barcode: string              // Links to ProductRecord
  productId: string            
  productName: string          
  category: string             
  originalPrice: number        
  imageUrls: string[]          // Storage URLs for captured images
  aiAnalysis: {
    conditionGrade: string
    confidenceScore: number
    defectsDetected: string[]
    analysisSummary: string
  }
  recommendation: {
    action: 'Restock' | 'Resell New' | 'Open Box Resale' | 'Refurbish' | 'Manual Review' | 'Donate' | 'Recycle'
    reasoning: string
    estimatedValue: number     // Recovery value estimate
    sustainabilityScore: number // 0-100
  }
  createdAt: Date              // Timestamp of analysis
  processedBy?: string         // Future: Worker ID
}

// Indexes
// - createdAt: descending index for recent items query
// - recommendation.action: non-unique index for dashboard aggregation
// - barcode: non-unique index for product history

// Example Document
{
  "_id": ObjectId("..."),
  "barcode": "1234567890123",
  "productId": "PROD-001",
  "productName": "Wireless Bluetooth Headphones",
  "category": "Electronics",
  "originalPrice": 79.99,
  "imageUrls": [
    "https://bucket.s3.amazonaws.com/img1.jpg",
    "https://bucket.s3.amazonaws.com/img2.jpg",
    "https://bucket.s3.amazonaws.com/img3.jpg"
  ],
  "aiAnalysis": {
    "conditionGrade": "Good",
    "confidenceScore": 85,
    "defectsDetected": ["Minor scratch on left earcup"],
    "analysisSummary": "Overall good condition with minimal wear"
  },
  "recommendation": {
    "action": "Open Box Resale",
    "reasoning": "Good condition with minor cosmetic defect, suitable for discounted resale",
    "estimatedValue": 55.99,
    "sustainabilityScore": 82
  },
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```


### Seed Data Strategy

```typescript
// 50 Products distributed across 5 categories
const seedDistribution = {
  'Electronics': 15,              // Laptops, tablets, cameras, etc.
  'Mobile Accessories': 10,       // Cases, chargers, cables, etc.
  'Home & Kitchen': 10,           // Appliances, cookware, etc.
  'Clothing': 10,                 // Shirts, pants, jackets, etc.
  'Books': 5                      // Fiction, non-fiction, etc.
}

// Barcode format: 13-digit EAN-13 standard
// Generate unique barcodes in range 1000000000001 to 1000000000050

// Price ranges by category
const priceRanges = {
  'Electronics': [49.99, 299.99],
  'Mobile Accessories': [9.99, 49.99],
  'Home & Kitchen': [19.99, 149.99],
  'Clothing': [14.99, 89.99],
  'Books': [9.99, 29.99]
}
```


## API Route Design

### API Endpoints

```typescript
// Product Lookup API
// POST /api/products/lookup
interface ProductLookupRequest {
  barcode: string
}

interface ProductLookupResponse {
  success: boolean
  product?: ProductRecord
  error?: string
}

// Image Upload & Analysis API
// POST /api/analysis/upload
interface AnalysisUploadRequest {
  barcode: string
  images: File[]  // FormData with 3-5 images
}

interface AnalysisUploadResponse {
  success: boolean
  analysisId?: string
  analysis?: AIAnalysisResult
  recommendation?: Recommendation
  error?: string
}

// Analysis Result Retrieval API
// GET /api/analysis/[id]
interface AnalysisGetResponse {
  success: boolean
  analysis?: AnalysisRecord
  error?: string
}

// Dashboard Statistics API
// GET /api/dashboard
interface DashboardResponse {
  success: boolean
  stats?: DashboardStats
  recentItems?: AnalysisRecord[]
  error?: string
}
```


### API Route Implementation Details

```typescript
// /api/products/lookup route handler
async function handleProductLookup(req: NextRequest): Promise<NextResponse> {
  // 1. Parse request body
  // 2. Validate barcode format
  // 3. Connect to MongoDB
  // 4. Query ProductRepository.findByBarcode()
  // 5. Return product or 404 error
}

// /api/analysis/upload route handler
async function handleAnalysisUpload(req: NextRequest): Promise<NextResponse> {
  // 1. Parse multipart/form-data
  // 2. Validate images (count, size, format)
  // 3. Lookup product by barcode
  // 4. Upload images via StorageService
  // 5. Call AIAnalysisService with image URLs
  // 6. Generate recommendation via RecommendationEngine
  // 7. Save AnalysisRecord to MongoDB
  // 8. Return analysis ID and results
}

// /api/analysis/[id] route handler
async function handleAnalysisGet(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  // 1. Parse analysis ID from params
  // 2. Connect to MongoDB
  // 3. Query AnalysisRepository.findById()
  // 4. Return analysis record or 404 error
}

// /api/dashboard route handler
async function handleDashboard(req: NextRequest): Promise<NextResponse> {
  // 1. Connect to MongoDB
  // 2. Call AnalysisRepository.getStatistics()
  // 3. Call AnalysisRepository.getRecentAnalyses(100)
  // 4. Return dashboard data
}
```


### Error Response Format

```typescript
interface APIError {
  success: false
  error: string
  code?: string  // Machine-readable error code
  details?: any  // Additional error context
}

// Standard error codes
const ERROR_CODES = {
  INVALID_BARCODE: 'INVALID_BARCODE',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  INVALID_IMAGES: 'INVALID_IMAGES',
  IMAGE_UPLOAD_FAILED: 'IMAGE_UPLOAD_FAILED',
  AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  ANALYSIS_NOT_FOUND: 'ANALYSIS_NOT_FOUND'
}
```


## S3 Storage Architecture

### Bucket Structure

```
afora-returns-images/
├── analyses/
│   ├── {analysisId}/
│   │   ├── image-0.jpg
│   │   ├── image-1.jpg
│   │   ├── image-2.jpg
│   │   ├── image-3.jpg
│   │   └── image-4.jpg
```

### Storage Service Implementation

```typescript
class S3StorageService implements IStorageService {
  private s3Client: S3Client
  private bucketName: string
  
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
    this.bucketName = process.env.S3_BUCKET_NAME || 'afora-returns-images'
  }
  
  async uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]> {
    const uploadPromises = images.map(async (image, index) => {
      const key = `analyses/${prefix}/image-${index}.${this.getExtension(image.type)}`
      const buffer = await image.arrayBuffer()
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: image.type
      })
      
      await this.s3Client.send(command)
      
      return {
        key,
        url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
        size: image.size
      }
    })
    
    return await Promise.all(uploadPromises)
  }
  
  async getImageUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    })
    
    // Generate signed URL valid for 1 hour
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })
  }
  
  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }
    return map[mimeType] || 'jpg'
  }
}
```


### Mock Storage Service Implementation

```typescript
class MockStorageService implements IStorageService {
  private inMemoryStore: Map<string, string> = new Map()
  
  async uploadImages(images: File[], prefix: string): Promise<ImageUploadResult[]> {
    const uploadPromises = images.map(async (image, index) => {
      const key = `mock-analyses/${prefix}/image-${index}.${this.getExtension(image.type)}`
      
      // Convert to base64 data URL
      const buffer = await image.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const dataUrl = `data:${image.type};base64,${base64}`
      
      // Store in memory
      this.inMemoryStore.set(key, dataUrl)
      
      return {
        key,
        url: dataUrl,  // Return data URL directly for frontend display
        size: image.size
      }
    })
    
    return await Promise.all(uploadPromises)
  }
  
  async getImageUrl(key: string): Promise<string> {
    const url = this.inMemoryStore.get(key)
    if (!url) {
      throw new Error(`Image not found: ${key}`)
    }
    return url
  }
  
  async deleteImages(keys: string[]): Promise<void> {
    keys.forEach(key => this.inMemoryStore.delete(key))
  }
  
  private getExtension(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }
    return map[mimeType] || 'jpg'
  }
}
```


## Bedrock Integration Architecture

### AI Analysis Prompt Design

```typescript
const VISION_PROMPT_TEMPLATE = `
You are an AI assistant analyzing returned product images for condition assessment.

Product Context:
- Name: {productName}
- Brand: {brand}
- Category: {category}
- Original Price: ${originalPrice}

Task:
Analyze the provided images and assess the product condition. Provide your response in the following JSON format:

{
  "conditionGrade": "Excellent" | "Good" | "Fair" | "Poor" | "Damaged",
  "confidenceScore": <number between 0-100>,
  "defectsDetected": ["defect1", "defect2", ...],
  "analysisSummary": "<brief summary of condition>"
}

Grading Criteria:
- Excellent: Like new, no visible defects
- Good: Minor cosmetic wear, fully functional
- Fair: Noticeable wear, functional with minor issues
- Poor: Significant wear or functionality issues
- Damaged: Broken, non-functional, or major damage

Consider:
- Physical condition (scratches, dents, discoloration)
- Completeness (all parts present)
- Packaging condition
- Functionality indicators
`
```


### Bedrock Service Implementation

```typescript
class BedrockService implements IAIAnalysisService {
  private client: BedrockRuntimeClient
  private modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0'
  
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
  }
  
  async analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult> {
    // 1. Fetch images and convert to base64
    const imageContents = await this.fetchImagesAsBase64(imageUrls)
    
    // 2. Build prompt with product context
    const prompt = this.buildPrompt(productContext)
    
    // 3. Construct Bedrock request with vision
    const request = {
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContents.map(img => ({
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: img.mediaType,
                  data: img.base64
                }
              }))
            ]
          }
        ]
      })
    }
    
    // 4. Invoke Bedrock
    const command = new InvokeModelCommand(request)
    const response = await this.client.send(command)
    
    // 5. Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    const analysisText = responseBody.content[0].text
    
    // 6. Extract JSON from response
    const analysis = this.parseAnalysisResponse(analysisText)
    
    return analysis
  }
  
  private buildPrompt(context: ProductContext): string {
    return VISION_PROMPT_TEMPLATE
      .replace('{productName}', context.productName)
      .replace('{brand}', context.brand)
      .replace('{category}', context.category)
      .replace('{originalPrice}', context.originalPrice.toFixed(2))
  }
  
  private parseAnalysisResponse(text: string): AIAnalysisResult {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    return JSON.parse(jsonMatch[1] || jsonMatch[0])
  }
}
```


### Mock Bedrock Service Implementation

```typescript
class MockBedrockService implements IAIAnalysisService {
  private categoryConfidence: Record<string, number> = {
    'Electronics': 85,
    'Mobile Accessories': 82,
    'Home & Kitchen': 78,
    'Clothing': 75,
    'Books': 88
  }
  
  private defectsByCategory: Record<string, string[]> = {
    'Electronics': ['Screen scratches', 'Battery wear', 'Button malfunction', 'Port damage', 'Cosmetic dents'],
    'Mobile Accessories': ['Cable fraying', 'Case discoloration', 'Loose fit', 'Missing components'],
    'Home & Kitchen': ['Stains', 'Minor rust', 'Chipped edges', 'Discoloration'],
    'Clothing': ['Fabric pilling', 'Loose threads', 'Minor stains', 'Fading'],
    'Books': ['Cover wear', 'Page yellowing', 'Spine creasing', 'Minor water damage']
  }
  
  async analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult> {
    // Simulate API delay
    await this.delay(150 + Math.random() * 150)
    
    // Base confidence on category
    const baseConfidence = this.categoryConfidence[productContext.category] || 80
    
    // Add randomness (-10 to +10)
    const confidenceScore = Math.min(100, Math.max(0, baseConfidence + (Math.random() * 20 - 10)))
    
    // Determine condition grade based on confidence
    const conditionGrade = this.getConditionGrade(confidenceScore)
    
    // Select random defects if not Excellent
    const defectsDetected = conditionGrade === 'Excellent' 
      ? [] 
      : this.selectRandomDefects(productContext.category, Math.floor(Math.random() * 3))
    
    // Generate summary
    const analysisSummary = this.generateSummary(conditionGrade, defectsDetected)
    
    return {
      conditionGrade,
      confidenceScore: Math.round(confidenceScore),
      defectsDetected,
      analysisSummary
    }
  }
  
  private getConditionGrade(confidence: number): AIAnalysisResult['conditionGrade'] {
    if (confidence >= 90) return 'Excellent'
    if (confidence >= 75) return 'Good'
    if (confidence >= 60) return 'Fair'
    if (confidence >= 40) return 'Poor'
    return 'Damaged'
  }
  
  private selectRandomDefects(category: string, count: number): string[] {
    const defects = this.defectsByCategory[category] || []
    const shuffled = [...defects].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }
  
  private generateSummary(grade: string, defects: string[]): string {
    if (grade === 'Excellent') {
      return 'Product is in excellent condition with no visible defects.'
    }
    return `Product shows ${grade.toLowerCase()} condition. ${defects.length > 0 ? 'Defects: ' + defects.join(', ') + '.' : ''}`
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```


## Recommendation Engine Architecture

### Core Recommendation Logic

```typescript
interface Recommendation {
  action: 'Restock' | 'Resell New' | 'Open Box Resale' | 'Refurbish' | 'Manual Review' | 'Donate' | 'Recycle'
  reasoning: string
  estimatedValue: number
  sustainabilityScore: number
}

class RecommendationEngine {
  // MVP: Confidence-based threshold logic
  generateRecommendation(
    aiAnalysis: AIAnalysisResult,
    product: ProductRecord
  ): Recommendation {
    const { confidenceScore, conditionGrade, defectsDetected } = aiAnalysis
    const { originalPrice } = product
    
    // Apply threshold rules
    if (confidenceScore > 90) {
      return this.createRestockRecommendation(originalPrice)
    } else if (confidenceScore >= 80) {
      return this.createOpenBoxRecommendation(originalPrice)
    } else if (confidenceScore >= 70) {
      return this.createRefurbishRecommendation(originalPrice, defectsDetected)
    } else if (confidenceScore >= 60) {
      return this.createManualReviewRecommendation(originalPrice)
    } else {
      return this.createDonateRecycleRecommendation(originalPrice, conditionGrade)
    }
  }
  
  private createRestockRecommendation(originalPrice: number): Recommendation {
    return {
      action: conditionGrade === 'Excellent' ? 'Restock' : 'Resell New',
      reasoning: 'Product is in excellent condition and can be restocked as new inventory.',
      estimatedValue: originalPrice * 0.95, // 95% recovery
      sustainabilityScore: 95
    }
  }
  
  private createOpenBoxRecommendation(originalPrice: number): Recommendation {
    return {
      action: 'Open Box Resale',
      reasoning: 'Product is in good condition with minor cosmetic issues. Suitable for discounted resale.',
      estimatedValue: originalPrice * 0.70, // 70% recovery
      sustainabilityScore: 85
    }
  }
  
  private createRefurbishRecommendation(originalPrice: number, defects: string[]): Recommendation {
    return {
      action: 'Refurbish',
      reasoning: `Product requires refurbishment. Identified issues: ${defects.join(', ')}. Can be restored and resold.`,
      estimatedValue: originalPrice * 0.50, // 50% recovery after refurb costs
      sustainabilityScore: 75
    }
  }
  
  private createManualReviewRecommendation(originalPrice: number): Recommendation {
    return {
      action: 'Manual Review',
      reasoning: 'AI confidence is moderate. Manual inspection recommended to determine best action.',
      estimatedValue: originalPrice * 0.40, // Conservative estimate
      sustainabilityScore: 60
    }
  }
  
  private createDonateRecycleRecommendation(originalPrice: number, grade: string): Recommendation {
    const action = grade === 'Damaged' ? 'Recycle' : 'Donate'
    return {
      action,
      reasoning: action === 'Recycle' 
        ? 'Product is damaged beyond economical repair. Recommend recycling for parts/materials.'
        : 'Product has low resale value but may be useful for donation.',
      estimatedValue: action === 'Recycle' ? originalPrice * 0.05 : originalPrice * 0.10,
      sustainabilityScore: action === 'Recycle' ? 40 : 50
    }
  }
}
```


### Future Enhancement Architecture

```typescript
// Future: Enhanced recommendation with cost analysis
interface EnhancedRecommendationEngine extends RecommendationEngine {
  // Phase 2: Add repair cost estimation
  estimateRepairCost(defects: string[], category: string): number
  
  // Phase 3: Add resale value prediction
  predictResaleValue(product: ProductRecord, condition: string, marketData: MarketData): number
  
  // Phase 4: Add sustainability metrics
  calculateDetailedSustainabilityScore(
    action: string, 
    carbonFootprint: number, 
    materialsRecovered: number
  ): SustainabilityMetrics
  
  // Phase 5: Add optimization
  optimizeRecommendation(
    options: Recommendation[], 
    constraints: BusinessConstraints
  ): Recommendation
}

// Extensible design allows drop-in replacement
// Current: const engine = new RecommendationEngine()
// Future: const engine = new EnhancedRecommendationEngine()
```


## Dashboard Architecture

### Dashboard Statistics

```typescript
interface DashboardStats {
  totalItems: number
  actionBreakdown: {
    restock: number
    resellNew: number
    openBox: number
    refurbish: number
    manualReview: number
    donate: number
    recycle: number
  }
  totalEstimatedValue: number
  averageSustainabilityScore: number
}

class DashboardService {
  async getStatistics(repository: AnalysisRepository): Promise<DashboardStats> {
    const analyses = await repository.getAllAnalyses()
    
    return {
      totalItems: analyses.length,
      actionBreakdown: this.calculateActionBreakdown(analyses),
      totalEstimatedValue: this.calculateTotalValue(analyses),
      averageSustainabilityScore: this.calculateAverageSustainability(analyses)
    }
  }
  
  private calculateActionBreakdown(analyses: AnalysisRecord[]): DashboardStats['actionBreakdown'] {
    const breakdown = {
      restock: 0,
      resellNew: 0,
      openBox: 0,
      refurbish: 0,
      manualReview: 0,
      donate: 0,
      recycle: 0
    }
    
    analyses.forEach(analysis => {
      const action = this.normalizeAction(analysis.recommendation.action)
      breakdown[action]++
    })
    
    return breakdown
  }
  
  private normalizeAction(action: string): keyof DashboardStats['actionBreakdown'] {
    const map: Record<string, keyof DashboardStats['actionBreakdown']> = {
      'Restock': 'restock',
      'Resell New': 'resellNew',
      'Open Box Resale': 'openBox',
      'Refurbish': 'refurbish',
      'Manual Review': 'manualReview',
      'Donate': 'donate',
      'Recycle': 'recycle'
    }
    return map[action] || 'manualReview'
  }
  
  private calculateTotalValue(analyses: AnalysisRecord[]): number {
    return analyses.reduce((sum, analysis) => sum + analysis.recommendation.estimatedValue, 0)
  }
  
  private calculateAverageSustainability(analyses: AnalysisRecord[]): number {
    if (analyses.length === 0) return 0
    const total = analyses.reduce((sum, analysis) => sum + analysis.recommendation.sustainabilityScore, 0)
    return Math.round(total / analyses.length)
  }
}
```


### MongoDB Aggregation for Dashboard

```typescript
// Efficient aggregation pipeline for dashboard stats
async function getDashboardStatsAggregated(db: Db): Promise<DashboardStats> {
  const collection = db.collection('analyses')
  
  const pipeline = [
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: '$recommendation.estimatedValue' },
        avgSustainability: { $avg: '$recommendation.sustainabilityScore' },
        actions: { $push: '$recommendation.action' }
      }
    },
    {
      $project: {
        _id: 0,
        totalItems: 1,
        totalEstimatedValue: { $round: ['$totalValue', 2] },
        averageSustainabilityScore: { $round: ['$avgSustainability', 0] },
        actionBreakdown: {
          restock: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Restock'] }
              }
            }
          },
          resellNew: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Resell New'] }
              }
            }
          },
          openBox: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Open Box Resale'] }
              }
            }
          },
          refurbish: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Refurbish'] }
              }
            }
          },
          manualReview: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Manual Review'] }
              }
            }
          },
          donate: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Donate'] }
              }
            }
          },
          recycle: {
            $size: {
              $filter: {
                input: '$actions',
                cond: { $eq: ['$$this', 'Recycle'] }
              }
            }
          }
        }
      }
    }
  ]
  
  const result = await collection.aggregate(pipeline).toArray()
  return result[0] || this.getEmptyStats()
}
```


## Folder Structure

```
afora-returns-platform/
├── .env.local                      # Environment variables
├── .env.example                    # Example env file
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
├── tailwind.config.ts              # Tailwind CSS configuration
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   ├── scan/
│   │   │   └── page.tsx            # Barcode scan page
│   │   ├── product/
│   │   │   └── [barcode]/
│   │   │       └── page.tsx        # Product details & image capture
│   │   ├── result/
│   │   │   └── [analysisId]/
│   │   │       └── page.tsx        # Analysis result page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Dashboard page
│   │   └── api/                    # API Routes
│   │       ├── products/
│   │       │   └── lookup/
│   │       │       └── route.ts    # POST /api/products/lookup
│   │       ├── analysis/
│   │       │   ├── upload/
│   │       │   │   └── route.ts    # POST /api/analysis/upload
│   │       │   └── [id]/
│   │       │       └── route.ts    # GET /api/analysis/[id]
│   │       └── dashboard/
│   │           └── route.ts        # GET /api/dashboard
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── BarcodeScanner.tsx      # Barcode scanner component
│   │   ├── ManualBarcodeEntry.tsx  # Manual barcode input
│   │   ├── ImageCapture.tsx        # Image capture component
│   │   ├── ProductCard.tsx         # Product display card
│   │   ├── AnalysisResult.tsx      # Analysis result display
│   │   ├── RecommendationCard.tsx  # Recommendation display
│   │   └── DashboardStats.tsx      # Dashboard statistics
│   ├── lib/                        # Core libraries
│   │   ├── db/
│   │   │   ├── mongodb.ts          # MongoDB connection
│   │   │   ├── repositories/
│   │   │   │   ├── ProductRepository.ts
│   │   │   │   └── AnalysisRepository.ts
│   │   │   └── seed.ts             # Database seeding script
│   │   ├── services/
│   │   │   ├── storage/
│   │   │   │   ├── IStorageService.ts
│   │   │   │   ├── MockStorageService.ts
│   │   │   │   └── S3StorageService.ts
│   │   │   ├── ai/
│   │   │   │   ├── IAIAnalysisService.ts
│   │   │   │   ├── MockBedrockService.ts
│   │   │   │   └── BedrockService.ts
│   │   │   ├── recommendation/
│   │   │   │   └── RecommendationEngine.ts
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardService.ts
│   │   │   └── ServiceFactory.ts   # Service instantiation
│   │   ├── types/
│   │   │   ├── product.ts          # Product types
│   │   │   ├── analysis.ts         # Analysis types
│   │   │   ├── recommendation.ts   # Recommendation types
│   │   │   └── dashboard.ts        # Dashboard types
│   │   └── utils/
│   │       ├── validation.ts       # Input validation
│   │       └── errors.ts           # Error handling
│   └── styles/
│       └── globals.css             # Global styles
└── scripts/
    └── seed-database.ts            # Database seeding script
```


## Mock vs Real AWS Strategy

### Environment Configuration

```bash
# .env.local (Development with Mock Services)
USE_MOCK_STORAGE=true
USE_MOCK_BEDROCK=true
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DB_NAME=afora-returns-dev

# .env.local (Production with Real AWS Services)
USE_MOCK_STORAGE=false
USE_MOCK_BEDROCK=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=afora-returns-images
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DB_NAME=afora-returns-prod
```

### Service Selection Logic

```typescript
// Service Factory determines which implementation to use
class ServiceFactory {
  static getStorageService(): IStorageService {
    const useMock = process.env.USE_MOCK_STORAGE === 'true'
    
    if (useMock) {
      console.log('[ServiceFactory] Using MockStorageService')
      return new MockStorageService()
    }
    
    console.log('[ServiceFactory] Using S3StorageService')
    return new S3StorageService()
  }
  
  static getAIService(): IAIAnalysisService {
    const useMock = process.env.USE_MOCK_BEDROCK === 'true'
    
    if (useMock) {
      console.log('[ServiceFactory] Using MockBedrockService')
      return new MockBedrockService()
    }
    
    console.log('[ServiceFactory] Using BedrockService')
    return new BedrockService()
  }
}
```


### Mock Service Benefits

**MockStorageService advantages**:
- No AWS credentials required for local development
- Instant image storage (no network latency)
- Works offline
- No S3 costs during development/demos
- Simpler debugging with in-memory storage
- Perfect for demos and testing

**MockBedrockService advantages**:
- No Bedrock API costs during development
- Deterministic results for testing
- Fast response times (no API latency)
- No AWS credential management
- Works offline
- Reliable demo experience without API quota concerns

**When to use Mock Services**:
- Local development
- Demo presentations
- Automated testing
- Offline development
- Cost-conscious development

**When to use Real AWS Services**:
- Production deployment
- Real-world testing with actual AI
- Performance benchmarking
- Integration testing with AWS infrastructure

### Switching Strategy

```typescript
// No code changes required to switch between mock and real services
// Simply update environment variables:

// For Demo:
// USE_MOCK_STORAGE=true
// USE_MOCK_BEDROCK=true

// For Production:
// USE_MOCK_STORAGE=false
// USE_MOCK_BEDROCK=false
// AWS_REGION=us-east-1
// AWS_ACCESS_KEY_ID=...
// AWS_SECRET_ACCESS_KEY=...
// S3_BUCKET_NAME=...

// The same codebase works for both scenarios
```


## Error Handling Strategy

### Error Categories

```typescript
// User-facing errors
class UserError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message)
    this.name = 'UserError'
  }
}

// System errors
class SystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'SystemError'
  }
}

// Validation errors
class ValidationError extends UserError {
  constructor(field: string, issue: string) {
    super(
      `Validation failed for ${field}: ${issue}`,
      'VALIDATION_ERROR',
      `Invalid ${field}: ${issue}`
    )
    this.name = 'ValidationError'
  }
}
```

### Error Handling in API Routes

```typescript
// Centralized error handler for API routes
function handleAPIError(error: unknown): NextResponse {
  console.error('[API Error]', error)
  
  if (error instanceof UserError) {
    return NextResponse.json(
      {
        success: false,
        error: error.userMessage,
        code: error.code
      },
      { status: 400 }
    )
  }
  
  if (error instanceof SystemError) {
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred. Please try again.',
        code: error.code
      },
      { status: 500 }
    )
  }
  
  // Unknown error
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR'
    },
    { status: 500 }
  )
}
```


### Frontend Error Handling

```typescript
// Error display component
interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// API call with error handling
async function callAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(endpoint, options)
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }
    
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error. Please check your connection.')
  }
}
```

### Validation

```typescript
// Image validation
function validateImages(files: File[]): { valid: boolean; error?: string } {
  if (files.length < 3) {
    return { valid: false, error: 'Please capture at least 3 images' }
  }
  
  if (files.length > 5) {
    return { valid: false, error: 'Maximum 5 images allowed' }
  }
  
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return { valid: false, error: `Image "${file.name}" exceeds 10MB limit` }
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `Image "${file.name}" has unsupported format` }
    }
  }
  
  return { valid: true }
}

// Barcode validation
function validateBarcode(barcode: string): { valid: boolean; error?: string } {
  if (!barcode || barcode.trim().length === 0) {
    return { valid: false, error: 'Barcode cannot be empty' }
  }
  
  // Allow alphanumeric and some special characters
  if (!/^[A-Za-z0-9\-_]+$/.test(barcode)) {
    return { valid: false, error: 'Barcode contains invalid characters' }
  }
  
  return { valid: true }
}
```


## Mobile Optimization

### Responsive Design Strategy

```typescript
// Mobile-first Tailwind CSS classes
const mobileOptimizedClasses = {
  container: 'w-full max-w-md mx-auto px-4 py-6',
  card: 'bg-white rounded-lg shadow-md p-4 sm:p-6',
  button: 'w-full sm:w-auto px-6 py-3 text-lg font-semibold rounded-lg',
  heading: 'text-2xl sm:text-3xl font-bold',
  text: 'text-base sm:text-lg'
}

// Touch-friendly component sizing
const touchTargets = {
  minHeight: '44px',  // iOS accessibility minimum
  minWidth: '44px',
  padding: '12px 16px'
}
```

### Camera Integration

```typescript
// BarcodeScanner mobile optimization
interface Html5QrcodeConfig {
  fps: 10,
  qrbox: { 
    width: 250, 
    height: 250 
  },
  aspectRatio: 1.0,
  // Use rear camera by default on mobile
  facingMode: { exact: 'environment' }
}

// ImageCapture mobile optimization
const cameraConstraints: MediaStreamConstraints = {
  video: {
    facingMode: 'environment',  // Rear camera
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
}
```

### Progressive Enhancement

```typescript
// Feature detection
const features = {
  hasCamera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
  hasFileAPI: window.File && window.FileReader,
  hasTouch: 'ontouchstart' in window
}

// Fallback strategies
if (!features.hasCamera) {
  // Show file upload option only
  return <FileUploadOnly />
}

if (!features.hasFileAPI) {
  // Show error message with browser upgrade suggestion
  return <BrowserNotSupported />
}
```


## Performance Considerations

### Image Optimization

```typescript
// Client-side image compression before upload
async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Scale down if too large
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
        
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }))
            } else {
              reject(new Error('Compression failed'))
            }
          },
          'image/jpeg',
          0.8  // 80% quality
        )
      }
    }
    
    reader.onerror = reject
  })
}
```

### Database Query Optimization

```typescript
// Index strategy for optimal query performance
async function createIndexes(db: Db): Promise<void> {
  const products = db.collection('products')
  const analyses = db.collection('analyses')
  
  // Product lookup by barcode (most frequent query)
  await products.createIndex({ barcode: 1 }, { unique: true })
  
  // Dashboard queries
  await analyses.createIndex({ createdAt: -1 })  // Recent items
  await analyses.createIndex({ 'recommendation.action': 1 })  // Action breakdown
  
  // Product history lookup (future feature)
  await analyses.createIndex({ barcode: 1 })
}
```

### API Response Caching

```typescript
// Cache dashboard statistics for 30 seconds
let dashboardCache: {
  data: DashboardResponse | null
  timestamp: number
} = { data: null, timestamp: 0 }

const CACHE_TTL = 30 * 1000  // 30 seconds

async function getCachedDashboard(): Promise<DashboardResponse | null> {
  const now = Date.now()
  
  if (dashboardCache.data && (now - dashboardCache.timestamp < CACHE_TTL)) {
    return dashboardCache.data
  }
  
  return null
}

function setCachedDashboard(data: DashboardResponse): void {
  dashboardCache = {
    data,
    timestamp: Date.now()
  }
}
```


## Security Considerations

### Input Validation

```typescript
// Strict validation on all API inputs
class InputValidator {
  static validateBarcode(barcode: unknown): string {
    if (typeof barcode !== 'string') {
      throw new ValidationError('barcode', 'Must be a string')
    }
    
    if (barcode.length === 0 || barcode.length > 100) {
      throw new ValidationError('barcode', 'Invalid length')
    }
    
    if (!/^[A-Za-z0-9\-_]+$/.test(barcode)) {
      throw new ValidationError('barcode', 'Contains invalid characters')
    }
    
    return barcode
  }
  
  static validateObjectId(id: unknown): ObjectId {
    if (typeof id !== 'string') {
      throw new ValidationError('id', 'Must be a string')
    }
    
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('id', 'Invalid ObjectId format')
    }
    
    return new ObjectId(id)
  }
}
```

### File Upload Security

```typescript
// Prevent malicious file uploads
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB

function validateUploadedFile(file: File): void {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ValidationError('file', 'Unsupported file type')
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('file', 'File too large')
  }
  
  // Check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase()
  const expectedExts: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp']
  }
  
  if (!ext || !expectedExts[file.type]?.includes(ext)) {
    throw new ValidationError('file', 'File extension does not match type')
  }
}
```


### Environment Variable Security

```typescript
// Validate required environment variables at startup
function validateEnvironment(): void {
  const required = ['MONGODB_URI', 'MONGODB_DB_NAME']
  
  const useMockStorage = process.env.USE_MOCK_STORAGE === 'true'
  const useMockBedrock = process.env.USE_MOCK_BEDROCK === 'true'
  
  if (!useMockStorage) {
    required.push('AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME')
  }
  
  if (!useMockBedrock) {
    required.push('AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY')
  }
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Call on application startup
validateEnvironment()
```

### MongoDB Connection Security

```typescript
// Use connection string with authentication
const MONGODB_OPTIONS = {
  retryWrites: true,
  w: 'majority',
  authSource: 'admin',
  ssl: true,
  // Connection pooling
  maxPoolSize: 10,
  minPoolSize: 2,
  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
}

// Never log sensitive connection details
function sanitizeConnectionString(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//<credentials>@')
}
```


## Testing Strategy

### Unit Testing

```typescript
// Example: RecommendationEngine test
describe('RecommendationEngine', () => {
  const engine = new RecommendationEngine()
  
  test('should recommend Restock for confidence > 90', () => {
    const analysis: AIAnalysisResult = {
      conditionGrade: 'Excellent',
      confidenceScore: 95,
      defectsDetected: [],
      analysisSummary: 'Perfect condition'
    }
    
    const product: ProductRecord = {
      barcode: '1234567890123',
      productId: 'PROD-001',
      productName: 'Test Product',
      brand: 'TestBrand',
      category: 'Electronics',
      originalPrice: 100.00,
      description: 'Test'
    }
    
    const recommendation = engine.generateRecommendation(analysis, product)
    
    expect(recommendation.action).toBe('Restock')
    expect(recommendation.estimatedValue).toBeCloseTo(95.00)
    expect(recommendation.sustainabilityScore).toBeGreaterThan(90)
  })
  
  test('should recommend Open Box Resale for confidence 80-90', () => {
    const analysis: AIAnalysisResult = {
      conditionGrade: 'Good',
      confidenceScore: 85,
      defectsDetected: ['Minor scratch'],
      analysisSummary: 'Good condition with minor wear'
    }
    
    const product: ProductRecord = {
      barcode: '1234567890123',
      productId: 'PROD-001',
      productName: 'Test Product',
      brand: 'TestBrand',
      category: 'Electronics',
      originalPrice: 100.00,
      description: 'Test'
    }
    
    const recommendation = engine.generateRecommendation(analysis, product)
    
    expect(recommendation.action).toBe('Open Box Resale')
    expect(recommendation.estimatedValue).toBeCloseTo(70.00)
  })
})
```


### Integration Testing

```typescript
// Example: API route integration test
describe('POST /api/products/lookup', () => {
  test('should return product for valid barcode', async () => {
    const response = await fetch('http://localhost:3000/api/products/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: '1000000000001' })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.product).toBeDefined()
    expect(data.product.barcode).toBe('1000000000001')
  })
  
  test('should return 404 for unknown barcode', async () => {
    const response = await fetch('http://localhost:3000/api/products/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: 'UNKNOWN' })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })
})
```

### Mock Service Testing

```typescript
// Test that mock services work correctly
describe('MockBedrockService', () => {
  const service = new MockBedrockService()
  
  test('should return deterministic results', async () => {
    const result = await service.analyzeImages(
      ['mock-url-1', 'mock-url-2', 'mock-url-3'],
      {
        productName: 'Test Product',
        brand: 'TestBrand',
        category: 'Electronics',
        originalPrice: 100.00
      }
    )
    
    expect(result.conditionGrade).toBeDefined()
    expect(result.confidenceScore).toBeGreaterThan(0)
    expect(result.confidenceScore).toBeLessThanOrEqual(100)
    expect(result.defectsDetected).toBeInstanceOf(Array)
    expect(result.analysisSummary).toBeDefined()
  })
})
```


## Deployment Strategy

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

```bash
# Set via Vercel dashboard or CLI
vercel env add MONGODB_URI
vercel env add MONGODB_DB_NAME
vercel env add USE_MOCK_STORAGE
vercel env add USE_MOCK_BEDROCK

# For production with real AWS:
vercel env add AWS_REGION production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add S3_BUCKET_NAME production
```

### Build Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'afora-returns-images.s3.amazonaws.com',
      'afora-returns-images.s3.us-east-1.amazonaws.com'
    ],
    unoptimized: process.env.USE_MOCK_STORAGE === 'true'
  },
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig
```

### Database Seeding

```bash
# Seed database before first deployment
npm run seed

# Or create a manual seeding endpoint (disabled in production)
# POST /api/admin/seed (protected by environment check)
```


## Dependencies

### Core Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    
    "mongodb": "^6.3.0",
    "@aws-sdk/client-s3": "^3.484.0",
    "@aws-sdk/s3-request-presigner": "^3.484.0",
    "@aws-sdk/client-bedrock-runtime": "^3.484.0",
    
    "html5-qrcode": "^2.3.8",
    
    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "lucide-react": "^0.292.0",
    
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.0",
    
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "ts-node": "^10.9.2"
  }
}
```

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "seed": "ts-node scripts/seed-database.ts",
    "type-check": "tsc --noEmit"
  }
}
```


## Implementation Phases

### Phase 1: Core Infrastructure (Priority: Critical)
- Set up Next.js project with TypeScript
- Configure Tailwind CSS and shadcn/ui
- Create MongoDB connection and repository pattern
- Implement service factory with mock services
- Create database seed script with 50 products
- Set up basic project structure and folder organization

### Phase 2: Barcode Scanning (Priority: Critical)
- Implement landing page with "Start Scan" flow
- Integrate html5-qrcode for camera-based barcode scanning
- Implement manual barcode entry fallback
- Create product lookup API endpoint
- Display product details page after successful scan
- Handle barcode not found errors

### Phase 3: Image Capture (Priority: Critical)
- Implement image capture component (camera + file upload)
- Add image validation (3-5 images, format, size)
- Create preview and removal functionality
- Implement MockStorageService for development
- Implement S3StorageService for production
- Test image upload flow end-to-end

### Phase 4: AI Analysis (Priority: Critical)
- Implement MockBedrockService with deterministic logic
- Create analysis upload API endpoint
- Integrate RecommendationEngine with threshold rules
- Save analysis records to MongoDB
- Display analysis results and recommendations
- Handle AI analysis errors gracefully

### Phase 5: Dashboard (Priority: High)
- Create dashboard statistics aggregation
- Implement dashboard API endpoint
- Display total items, action breakdown, value recovered
- Show recent 100 processed items
- Add basic filtering and sorting
- Optimize queries with MongoDB aggregation

### Phase 6: Real AWS Integration (Priority: Medium)
- Implement BedrockService with Claude vision API
- Configure AWS credentials and S3 bucket
- Test real Bedrock analysis with sample images
- Compare mock vs real results
- Document switching between mock and real services

### Phase 7: Polish & Testing (Priority: High)
- Mobile responsive design refinement
- Error handling improvements
- Add loading states and progress indicators
- Write unit tests for core services
- Write integration tests for API routes
- Performance optimization and caching

### Phase 8: Demo Preparation (Priority: High)
- Ensure mock services work flawlessly
- Create demo script and walkthrough
- Prepare sample products for demo
- Test complete workflow multiple times
- Document known limitations and future enhancements
- Prepare presentation materials


## Future Enhancements

### Phase 2 Features (Post-MVP)

**Enhanced Recommendation Engine**:
- Repair cost estimation based on defect type and category
- Market-based resale value prediction using historical data
- Dynamic pricing suggestions for open box items
- Multi-factor optimization (cost, sustainability, market demand)

**Advanced Analytics**:
- Historical trends and patterns
- Category-wise performance metrics
- Time-based analysis (daily, weekly, monthly)
- Export reports as CSV/PDF

**Worker Authentication**:
- Simple PIN-based authentication
- Worker ID tracking for processed items
- Performance metrics per worker
- Shift-based statistics

**Inventory Integration**:
- Sync with warehouse management system
- Real-time inventory updates
- Automatic stock adjustments based on recommendations
- Integration with fulfillment centers

**Multi-language Support**:
- Spanish, Portuguese, French, German
- Localized UI and error messages
- Regional currency formatting

**Offline Support**:
- Queue processing when offline
- Sync when connection restored
- Local image caching
- Progressive Web App (PWA)

**Barcode Generation**:
- Generate new barcodes for items without one
- Print barcode labels from dashboard
- QR code support for internal tracking

**Batch Processing**:
- Process multiple items in one session
- Bulk upload images for multiple products
- Batch recommendation review

**Admin Panel**:
- Manage product catalog
- Review and override AI recommendations
- Configure recommendation thresholds
- User management and permissions

**Sustainability Reporting**:
- Carbon footprint calculations
- Materials recovery metrics
- Environmental impact dashboard
- Compliance reporting for regulations


## Correctness Properties

### Universal Quantification Properties

**Property 1: Barcode Uniqueness**
```
∀ product ∈ ProductCollection: 
  ¬∃ other_product ∈ ProductCollection: 
    (product ≠ other_product) ∧ (product.barcode = other_product.barcode)
```
*Every product in the database has a unique barcode; no two different products share the same barcode.*

**Property 2: Confidence Score Range**
```
∀ analysis ∈ AnalysisRecord:
  0 ≤ analysis.aiAnalysis.confidenceScore ≤ 100
```
*All AI confidence scores are within the valid range of 0 to 100.*

**Property 3: Image Count Constraint**
```
∀ analysis ∈ AnalysisRecord:
  3 ≤ length(analysis.imageUrls) ≤ 5
```
*Every analysis record contains between 3 and 5 images (inclusive).*

**Property 4: Recommendation Consistency**
```
∀ analysis ∈ AnalysisRecord:
  let c = analysis.aiAnalysis.confidenceScore
  let a = analysis.recommendation.action
  (c > 90 → a ∈ {'Restock', 'Resell New'}) ∧
  (80 ≤ c ≤ 90 → a = 'Open Box Resale') ∧
  (70 ≤ c < 80 → a = 'Refurbish') ∧
  (60 ≤ c < 70 → a = 'Manual Review') ∧
  (c < 60 → a ∈ {'Donate', 'Recycle'})
```
*Recommendations are consistent with confidence score thresholds defined in MVP requirements.*

**Property 5: Estimated Value Bounds**
```
∀ analysis ∈ AnalysisRecord:
  0 ≤ analysis.recommendation.estimatedValue ≤ analysis.originalPrice
```
*The estimated recovery value never exceeds the original product price.*

**Property 6: Sustainability Score Range**
```
∀ analysis ∈ AnalysisRecord:
  0 ≤ analysis.recommendation.sustainabilityScore ≤ 100
```
*All sustainability scores are within the valid range of 0 to 100.*

**Property 7: Timestamp Ordering**
```
∀ recent_items = getRecentAnalyses(100):
  ∀ i, j ∈ indices(recent_items):
    i < j → recent_items[i].createdAt ≥ recent_items[j].createdAt
```
*Recent items on the dashboard are ordered by timestamp in descending order (newest first).*

**Property 8: Dashboard Totals Accuracy**
```
∀ stats = getDashboardStats():
  stats.totalItems = sum(stats.actionBreakdown.values())
```
*The total items count equals the sum of all action breakdown counts.*

**Property 9: Image Format Validation**
```
∀ image ∈ uploadedImages:
  image.type ∈ {'image/jpeg', 'image/png', 'image/webp'} ∧
  image.size ≤ 10485760
```
*All uploaded images have valid MIME types and do not exceed 10MB.*

**Property 10: API Response Structure**
```
∀ response ∈ APIResponses:
  response.success ∈ {true, false} ∧
  (response.success = false → response.error ≠ null)
```
*All API responses include a success boolean, and failed responses include an error message.*

