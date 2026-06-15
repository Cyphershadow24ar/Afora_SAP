// Task 17.3: Secure environment variable validation.
// Validates required variables and never logs sensitive values.

export interface AppEnv {
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;
  USE_MOCK_STORAGE: boolean;
  USE_MOCK_BEDROCK: boolean;
}

export function validateEnv(): AppEnv {
  const missing: string[] = [];

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) missing.push('MONGODB_URI');

  if (missing.length > 0) {
    // Reference variable names only — never their values.
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    MONGODB_URI: MONGODB_URI as string,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'afora-returns',
    USE_MOCK_STORAGE: process.env.USE_MOCK_STORAGE !== 'false',
    USE_MOCK_BEDROCK: process.env.USE_MOCK_BEDROCK !== 'false',
  };
}
