// @ts-check
import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
// import eslintConfigPrettier from 'eslint-config-prettier';
import tsEslint from 'typescript-eslint';

// This is just an example default config for ESLint.
// You should change it to your needs following the documentation.
export default tsEslint.config(
  {
    ignores: ['**/build/**', '**/tmp/**', '**/coverage/**'],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.ts'], // We use TS config only for TS files
  })),
  // eslintConfigPrettier,
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
