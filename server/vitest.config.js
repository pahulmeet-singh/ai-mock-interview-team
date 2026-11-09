import { defineConfig } from 'vitest/config';

// Dummy values so src/config/env.js validates when unit tests import it.
export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-placeholder',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123',
      GEMINI_MOCK: 'true',
    },
  },
});
