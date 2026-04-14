import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // Disable base rules — unused-imports handles these more precisely.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Auto-remove unused imports on ESLint fix.
      'unused-imports/no-unused-imports': 'error',
      // Warn on unused variables; ignore _-prefixed variables only.
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Sort imports and exports alphabetically, grouped by: builtin → external → internal → relative.
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side-effect imports (e.g. import './globals.css').
            ['^\\u0000'],
            // Node.js builtins and React/Next first.
            ['^(react|next)(/.*|$)', '^node:'],
            // External packages.
            ['^@?\\w'],
            // Internal aliases (e.g. @/components).
            ['^@/'],
            // Relative imports, deepest last.
            ['^\\.\\./', '^\\./'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
  // Disables ESLint rules that conflict with Prettier — must be last.
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
