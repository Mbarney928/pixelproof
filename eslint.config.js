import js from '@eslint/js';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import boundaries from 'eslint-plugin-boundaries';
import pluginVue from 'eslint-plugin-vue';
import vueA11y from 'eslint-plugin-vuejs-accessibility';
import globals from 'globals';

const REVIEW = 'apps/review/src';
const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

export default defineConfigWithVueTs(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/.pixelproof/**',
      'apps/review/public/**',
      'playwright-report/**',
      'test-results/**',
      '.lighthouseci/**',
    ],
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueA11y.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,
  vueTsConfigs.stylisticTypeChecked,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['apps/review/**/*.{ts,vue}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      // Output encoding: never render HTML strings.
      'vue/no-v-html': 'error',
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/require-default-prop': 'off',
    },
  },
  // Feature-sliced layers: each layer may import only from layers below it.
  {
    files: [`${REVIEW}/**/*.{ts,vue}`],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': layers.map((type) => ({ type, pattern: `${REVIEW}/${type}/*`, mode: 'folder' })),
      'boundaries/include': [`${REVIEW}/**/*`],
      'import/resolver': { typescript: { project: 'apps/review/tsconfig.app.json' } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: layers.map((from, i) => ({
            from: { type: from },
            allow: { to: { type: layers.slice(i) } },
          })),
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/(pages|widgets|features|entities)/[^/]+/.+',
              message: 'Import a slice through its public index.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.stories.ts', `${REVIEW}/test/**`, 'e2e/**'],
    rules: { 'boundaries/dependencies': 'off', 'no-restricted-imports': 'off' },
  },
  {
    files: ['scripts/**/*.js', '*.config.{js,ts}', 'demo/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.js'],
    ...vueTsConfigs.disableTypeChecked,
  },
);
