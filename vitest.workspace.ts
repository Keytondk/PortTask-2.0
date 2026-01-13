import { defineWorkspace } from 'vitest/config';

/**
 * Navo Vitest Workspace Configuration
 * 
 * Unified test configuration across all packages and apps.
 * Run: pnpm test          - Run all tests
 * Run: pnpm test:coverage - Run with coverage
 * Run: pnpm test:ui       - Interactive UI
 */

export default defineWorkspace([
  // Frontend Apps
  {
    extends: './apps/key/vitest.config.ts',
    test: {
      name: 'key',
      root: './apps/key',
      environment: 'jsdom',
    },
  },
  {
    extends: './apps/portal/vitest.config.ts',
    test: {
      name: 'portal',
      root: './apps/portal',
      environment: 'jsdom',
    },
  },
  {
    extends: './apps/vendor/vitest.config.ts',
    test: {
      name: 'vendor',
      root: './apps/vendor',
      environment: 'jsdom',
    },
  },
  
  // Shared Packages
  {
    test: {
      name: 'ui',
      root: './packages/ui',
      environment: 'jsdom',
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'db',
      root: './packages/db',
      include: ['**/*.{test,spec}.ts'],
    },
  },
  {
    test: {
      name: 'design-tokens',
      root: './packages/design-tokens',
      include: ['**/*.{test,spec}.ts'],
    },
  },
]);
