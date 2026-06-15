# Implementation Plan: Afora Returns Platform

## Overview

This implementation plan breaks down the Afora Returns Platform into discrete coding tasks. The system is a Next.js application with TypeScript that processes warehouse returns using barcode scanning, image capture, AI analysis (via Amazon Bedrock), and actionable recommendations. The architecture includes service abstraction layers supporting both mock services (for demos) and real AWS services (S3 and Bedrock) for production.

## Tasks

- [x] 1. Set up Next.js project structure and configuration
  - Initialize Next.js 14+ with TypeScript and App Router
  - Configure eslint, prettier, and tsconfig.json
  - Set up project directory structure (app/, lib/, components/, types/)
  - Install core dependencies: mongodb, @aws-sdk/client-s3, @aws-sdk/client-bedrock-runtime, html5-qrcode
  - Create .env.example with all required environment variables
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 20.11_

- [ ] 2. Implement MongoDB connection and data models
  - [ ] 2.1 Create database connection manager with connection pooling
    - Implement DatabaseService class with connect() and disconnect() methods
    - Configure connection with retry writes, SSL/TLS, timeouts per requirements
    - Add connection URI sanitization for logging
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9_
  
  - [ ] 2.2 Define TypeScript interfaces for Product and Analysis documents
    - Create ProductRecord interface matching schema requirements
    - Create AnalysisRecord interface with nested aiAnalysis and recommendation objects
    - Add type definitions for all supporting types (condition grades, action types)
    - _Requirements: 22.1-22.11, 23.1-23.10_
  
  - [ ] 2.3 Implement ProductRepository with barcode lookup and seeding
    - Create ProductRepository class with findByBarcode, seedProducts, getAllProducts methods
    - Add index creation for barcode (unique) and category (non-unique)
    - _Requirements: 3.1, 3.4, 22.10, 22.11_
  
  - [ ] 2.4 Implement AnalysisRepository with CRUD and aggregation methods
    - Create AnalysisRepository class with create, findById, getRecentAnalyses, getStatistics methods
    - Add index creation for createdAt (descending), recommendation.action, and barcode
    - Implement MongoDB aggregation pipeline for dashboard statistics
    - _Requirements: 10.1-10.10, 12.1-12.13, 23.8, 23.9, 23.10_

- [ ] 3. Create product catalog seed data and seeding script
  - [ ] 3.1 Generate 50 product records with category distribution
    - Create seed data with 15 Electronics, 10 Mobile Accessories, 10 Home & Kitchen, 10 Clothing, 5 Books
    - Generate unique EAN-13 format barcodes (13 digits)
    - Assign prices within category-specific ranges
    - Include realistic product names, brands, and descriptions
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_
  
  - [ ] 3.2 Create database initialization script
    - Write script to check if products collection is empty
    - Seed products only if collection is empty (idempotent)
    - Create indexes on barcode (unique) and category fields
    - _Requirements: 13.10, 13.11, 22.10, 22.11_

- [ ] 4. Implement Storage Service abstraction layer
  - [ ] 4.1 Define IStorageService interface and ImageUploadResult type
    - Create interface with uploadImages, getImageUrl, deleteImages methods
    - Define return types for upload results with key, url, and size
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [ ] 4.2 Implement MockStorageService with in-memory storage
    - Use Map to store images as base64 data URLs
    - Implement uploadImages to convert File objects to base64
    - Return data URLs that can be displayed directly in browser
    - Organize keys with mock-analyses/{analysisId}/image-{index} format
    - _Requirements: 5.1, 5.5, 5.8_
  
  - [ ] 4.3 Implement S3StorageService with AWS SDK integration
    - Initialize S3Client with credentials from environment variables
    - Implement uploadImages using PutObjectCommand
    - Organize S3 keys with analyses/{analysisId}/image-{index} format
    - Implement getImageUrl to generate signed URLs valid for 1 hour
    - _Requirements: 5.2, 5.3, 5.4, 5.9_
  
  - [ ] 4.4 Create ServiceFactory for storage service selection
    - Read USE_MOCK_STORAGE environment variable
    - Return MockStorageService when USE_MOCK_STORAGE is "true"
    - Return S3StorageService when USE_MOCK_STORAGE is "false"
    - Log which storage implementation is being used
    - _Requirements: 6.3, 6.4_

- [ ] 5. Implement AI Analysis Service abstraction layer
  - [ ] 5.1 Define IAIAnalysisService interface and related types
    - Create interface with analyzeImages method
    - Define AIAnalysisResult with conditionGrade, confidenceScore, defectsDetected, analysisSummary
    - Define ProductContext type with productName, brand, category, originalPrice
    - _Requirements: 6.5_
  
  - [ ] 5.2 Implement MockBedrockService with deterministic mock logic
    - Create base confidence scores by category (Electronics: 85, Mobile Accessories: 82, etc.)
    - Add randomness of -10 to +10 points to base confidence
    - Map confidence scores to condition grades (Excellent >= 90, Good 75-89, Fair 60-74, Poor 40-59, Damaged < 40)
    - Define defect lists per category and select 0-2 random defects when condition is not Excellent
    - Simulate API latency of 100-300ms with delay
    - Generate human-readable analysis summary
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12_
  
  - [ ] 5.3 Implement BedrockService with Amazon Bedrock integration
    - Initialize BedrockRuntimeClient with AWS credentials from environment
    - Use Claude 3 Sonnet model (anthropic.claude-3-sonnet-20240229-v1:0)
    - Build vision prompt template including product context
    - Fetch image URLs and convert to base64 format
    - Construct InvokeModelCommand with images and prompt
    - Parse JSON response from Bedrock (handle markdown code blocks)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_
  
  - [ ] 5.4 Add ServiceFactory method for AI service selection
    - Read USE_MOCK_BEDROCK environment variable
    - Return MockBedrockService when USE_MOCK_BEDROCK is "true"
    - Return BedrockService when USE_MOCK_BEDROCK is "false"
    - Log which AI service implementation is being used
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6. Implement Recommendation Engine
  - [ ] 6.1 Define Recommendation interface and create RecommendationEngine class
    - Create interface with action, reasoning, estimatedValue, sustainabilityScore fields
    - Define all action types: Restock, Resell New, Open Box Resale, Refurbish, Manual Review, Donate, Recycle
    - _Requirements: 9.1_
  
  - [ ] 6.2 Implement confidence-based recommendation logic
    - Map confidence > 90 to Restock/Resell New with 95% recovery value and 95 sustainability score
    - Map confidence 80-90 to Open Box Resale with 70% recovery and 85 sustainability score
    - Map confidence 70-79 to Refurbish with 50% recovery and 75 sustainability score
    - Map confidence 60-69 to Manual Review with 40% recovery and 60 sustainability score
    - Map confidence < 60 to Donate (10% recovery, 45 sustainability) or Recycle (5% recovery, 30 sustainability)
    - Generate reasoning text explaining each recommendation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13, 9.14, 9.15, 9.16_

- [ ] 7. Checkpoint - Ensure backend services are complete
  - Verify all service interfaces are implemented
  - Test database connection and repository methods
  - Test mock services work without AWS credentials
  - Ensure all tests pass, ask the user if questions arise

- [ ] 8. Implement API route for product lookup
  - [ ] 8.1 Create POST /api/products/lookup endpoint
    - Parse and validate request body for barcode field
    - Validate barcode format (alphanumeric with hyphens/underscores, 1-100 chars)
    - Connect to MongoDB and query ProductRepository
    - Return 200 with product on success, 400 with error on not found, 500 on database errors
    - Log errors with sufficient context for debugging
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 18.9_
  
  - [ ]* 8.2 Write unit tests for product lookup endpoint
    - Test successful lookup with valid barcode
    - Test 400 error for invalid barcode format
    - Test 400 error for missing barcode
    - Test 400 error when product not found
    - Test 500 error on database failure
    - _Requirements: 14.1-14.10_

- [ ] 9. Implement API route for image upload and analysis
  - [ ] 9.1 Create POST /api/analysis/upload endpoint
    - Parse multipart/form-data for barcode and image files
    - Validate 3-5 images are provided
    - Validate each image format (JPEG, PNG, WebP) and size (< 10MB)
    - Lookup product by barcode, return 400 if not found
    - Generate unique analysis ID using ObjectId
    - Upload images via StorageService
    - Call AIAnalysisService with image URLs and product context
    - Call RecommendationEngine with AI analysis results
    - Save complete AnalysisRecord to MongoDB
    - Return 200 with analysis ID, AI result, and recommendation on success
    - Return appropriate error responses (400, 500) with specific error messages
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 15.11, 15.12, 15.13, 15.14, 15.15, 15.16, 15.17, 15.18_
  
  - [ ]* 9.2 Write unit tests for analysis upload endpoint
    - Test successful upload with 3-5 valid images
    - Test 400 error for invalid image count
    - Test 400 error for unsupported image format
    - Test 400 error for image size exceeding 10MB
    - Test 400 error when product not found
    - Test 500 error on storage service failure
    - Test 500 error on AI analysis failure
    - Test 500 error on database save failure
    - _Requirements: 15.1-15.18_

- [ ] 10. Implement API routes for analysis retrieval and dashboard
  - [ ] 10.1 Create GET /api/analysis/[id] endpoint
    - Extract analysis ID from URL path params
    - Validate ID is valid MongoDB ObjectId format
    - Query AnalysisRepository by ID
    - Return 200 with analysis record on success, 404 on not found, 500 on database error
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8_
  
  - [ ] 10.2 Create GET /api/dashboard endpoint
    - Calculate dashboard statistics via AnalysisRepository.getStatistics()
    - Retrieve 100 most recent analyses via getRecentAnalyses()
    - Return empty statistics (zero counts) when no records exist
    - Return 200 with success, statistics object, and recent items array on success
    - Return 500 on database errors
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_
  
  - [ ]* 10.3 Write unit tests for analysis retrieval and dashboard endpoints
    - Test successful analysis retrieval with valid ID
    - Test 400 error for invalid ObjectId format
    - Test 404 error when analysis not found
    - Test successful dashboard data retrieval
    - Test empty state handling when no analyses exist
    - Test database error handling
    - _Requirements: 16.1-16.8, 17.1-17.7_

- [ ] 11. Checkpoint - Ensure all API routes are functional
  - Test all API endpoints manually or with integration tests
  - Verify error handling and response formats
  - Ensure all tests pass, ask the user if questions arise

- [ ] 12. Build frontend components - Landing and Scan pages
  - [ ] 12.1 Create landing page (app/page.tsx)
    - Design hero section with platform description
    - Add "Start Processing Returns" button navigating to /scan
    - Add "View Dashboard" link
    - Implement responsive mobile-first design
    - _Requirements: 1.1, 19.1, 19.3, 19.4, 19.5_
  
  - [ ] 12.2 Create barcode scanner page (app/scan/page.tsx)
    - Integrate html5-qrcode library for camera-based barcode scanning
    - Configure scanner to use rear-facing camera on mobile
    - Display camera preview and scanning interface
    - Handle successful scan and navigate to product details
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 12.3 Add manual barcode entry fallback to scan page
    - Provide input field for manual barcode entry
    - Validate barcode format (alphanumeric with hyphens/underscores)
    - Display validation errors for invalid format
    - Submit valid barcode to product lookup API
    - _Requirements: 2.4, 2.5, 2.6, 2.7_
  
  - [ ] 12.4 Implement product lookup API call and error handling
    - Call POST /api/products/lookup with barcode
    - Handle successful response and navigate to product details page
    - Display user-friendly error messages for not found or network errors
    - Provide retry option on errors
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 18.1, 18.2, 18.3, 18.8_

- [ ] 13. Build frontend components - Product Details and Image Capture
  - [ ] 13.1 Create product details page (app/product/[barcode]/page.tsx)
    - Display product information (name, brand, category, original price)
    - Retrieve product from previous state or lookup API
    - Render ImageCaptureComponent
    - _Requirements: 3.2_
  
  - [ ] 13.2 Implement ImageCaptureComponent
    - Support camera capture and device file upload
    - Enforce 3-5 image requirement with validation
    - Validate image formats (JPEG, PNG, WebP) and size (< 10MB)
    - Display image thumbnails with remove functionality
    - Show validation errors for count, format, or size violations
    - Enable submit button only when 3-5 valid images are captured
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12_
  
  - [ ] 13.3 Implement image upload API call with loading state
    - Call POST /api/analysis/upload with barcode and images as FormData
    - Display loading indicator during upload and analysis
    - Handle success and navigate to results page with analysis ID
    - Display specific error messages for upload, validation, or analysis failures
    - Provide retry option on errors
    - _Requirements: 15.1-15.18, 18.4, 18.5, 18.6, 18.8_

- [ ] 14. Build frontend components - Results and Dashboard pages
  - [ ] 14.1 Create results page (app/result/[analysisId]/page.tsx)
    - Fetch analysis record from API using analysis ID
    - Display product details prominently
    - Show image gallery with all captured images
    - Display condition grade with visual styling (badges/colors)
    - Show confidence score as percentage
    - List all detected defects if any
    - Display AI analysis summary text
    - Show recommended action with prominent visual styling
    - Display reasoning for recommendation
    - Show estimated recovery value formatted as currency
    - Display sustainability score with visual indicator (progress bar)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_
  
  - [ ] 14.2 Add navigation buttons to results page
    - "Process Another Item" button navigating to /scan
    - "View Dashboard" button navigating to /dashboard
    - _Requirements: 11.11, 11.12_
  
  - [ ] 14.3 Create dashboard page (app/dashboard/page.tsx)
    - Call GET /api/dashboard to fetch statistics and recent items
    - Display total items processed prominently
    - Show action breakdown with counts (Restock, Open Box, Refurbish, etc.)
    - Visualize action distribution with chart or list
    - Display total estimated recovery value as formatted currency
    - Show average sustainability score with visual indicator
    - Render scrollable list of 100 most recent items (product name, action, timestamp)
    - Display empty state message when no items processed
    - Add refresh button to reload dashboard data
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12_

- [ ] 15. Implement responsive design and mobile optimizations
  - [ ] 15.1 Apply mobile-first CSS with Tailwind/CSS modules
    - Use full-width layouts with appropriate padding on mobile
    - Constrain content to max-width with centered layout on desktop
    - Ensure minimum 16px base font size on mobile
    - Set touch targets to at least 44px height and width
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ] 15.2 Optimize camera and image capture for mobile
    - Ensure barcode scanner works on mobile cameras
    - Optimize image capture component for mobile camera and photo library
    - Test touch interactions and provide visual feedback
    - Ensure usability in portrait and landscape orientations
    - _Requirements: 19.6, 19.7, 19.8, 19.9, 19.10_

- [ ] 16. Add comprehensive error handling and user feedback
  - [ ] 16.1 Implement global error boundary component
    - Catch React errors and display user-friendly fallback UI
    - Log errors to console for debugging
    - Never expose sensitive information in error messages
    - _Requirements: 18.9, 18.10_
  
  - [ ] 16.2 Add error handling to all API calls
    - Display "Network error. Please check your connection." for network failures
    - Display "Product not found. Please verify the barcode and try again." for 404s
    - Display "A system error occurred. Please try again." for 500 errors
    - Show specific validation errors for image uploads
    - Provide restart workflow option on errors
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.11_

- [ ] 17. Implement security measures
  - [ ] 17.1 Add input validation to all API routes
    - Sanitize and validate all user inputs
    - Prevent NoSQL injection in MongoDB queries
    - Validate file uploads (type, size, content)
    - Use parameterized queries and avoid string concatenation
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_
  
  - [ ] 17.2 Add security headers and CORS configuration
    - Configure Content Security Policy headers
    - Set X-Frame-Options, X-Content-Type-Options headers
    - Configure CORS for API routes if needed
    - _Requirements: 25.1, 25.2, 25.3, 25.4_
  
  - [ ] 17.3 Implement secure environment variable handling
    - Validate required environment variables on startup
    - Never log sensitive credentials
    - Sanitize MongoDB URI before logging
    - Use .env.local for local development secrets
    - _Requirements: 20.8, 20.10, 20.11, 21.7_

- [ ] 18. Final integration and testing
  - [ ] 18.1 Test complete workflow end-to-end with mock services
    - Scan barcode → lookup product → capture images → view analysis → check dashboard
    - Verify all data persists correctly in MongoDB
    - Test error scenarios and recovery paths
    - _Requirements: All workflow requirements_
  
  - [ ] 18.2 Test complete workflow with real AWS services
    - Configure AWS credentials and test S3 upload
    - Test Bedrock integration with real AI analysis
    - Verify signed URLs and image retrieval work correctly
    - _Requirements: 5.2, 5.9, 8.1-8.9_
  
  - [ ]* 18.3 Write integration tests for critical workflows
    - Test product lookup → image upload → analysis → recommendation flow
    - Test dashboard aggregation with multiple analysis records
    - Test service switching between mock and real implementations
    - _Requirements: All requirements_
  
  - [ ] 18.4 Create deployment documentation
    - Document environment variable configuration
    - Document MongoDB setup and seeding process
    - Document AWS setup for S3 and Bedrock
    - Create README with setup and run instructions
    - _Requirements: 20.1-20.11_

- [ ] 19. Final checkpoint - Ensure complete system works
  - Run complete workflow with both mock and real services
  - Verify all features match requirements
  - Ensure responsive design works on mobile and desktop
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user questions
- Property tests are not applicable to this infrastructure/web app project (no correctness properties defined)
- Unit tests and integration tests validate specific examples and end-to-end flows
- The implementation uses TypeScript throughout as specified in the design document
- Service abstraction layers (Storage and AI) support both mock and real AWS implementations
- The system can operate in demo mode (mock services) or production mode (real AWS services) via environment variables

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 5, "tasks": ["4.4", "5.2", "5.3"] },
    { "id": 6, "tasks": ["5.4", "6.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["9.1", "9.2"] },
    { "id": 10, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["12.3", "12.4", "13.1"] },
    { "id": 13, "tasks": ["13.2"] },
    { "id": 14, "tasks": ["13.3", "14.1"] },
    { "id": 15, "tasks": ["14.2", "14.3"] },
    { "id": 16, "tasks": ["15.1", "15.2"] },
    { "id": 17, "tasks": ["16.1", "16.2", "17.1"] },
    { "id": 18, "tasks": ["17.2", "17.3"] },
    { "id": 19, "tasks": ["18.1", "18.2", "18.3"] },
    { "id": 20, "tasks": ["18.4"] }
  ]
}
```
