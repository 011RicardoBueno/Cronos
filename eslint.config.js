import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import typescriptParser from '@typescript-eslint/parser'
import typescriptPlugin from '@typescript-eslint/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // Include TS/TSX files
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Add recommended TS rules
      ...Object.values(typescriptPlugin.configs.recommended).map(config => ({ ...config, files: ['**/*.{ts,tsx}'] })),
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser, // Use TS parser
      globals: {
        ...globals.browser,
        ...globals.jest // Jest globals should be here
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules, // Include TS specific rules
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }], // Adjusted for TS
    },
  },
  // Tests (Jest) globals
  {
    files: ['**/__tests__/**/*.js', '**/__tests__/**/*.jsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  // Node/Jest setup
  {
    files: ['jest.setup.js', 'jest.setup.ts'], // Include TS setup file if it exists
    languageOptions: {
      globals: globals.node,
    },
  },
])
