// @ts-check
import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: ['**/build/**', '**/tmp/**', '**/coverage/**'],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    extends: [...tsEslint.configs.recommended],

    files: ['**/*.ts'],

    plugins: {
      '@typescript-eslint': tsEslint.plugin,
    },

    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  {
    files: ['tests/**'],

    plugins: {
      vitest,
    },

    rules: {
      ...vitest.configs.recommended.rules,
    },

    settings: {
      vitest: {
        typecheck: true,
      },
    },

    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
);
