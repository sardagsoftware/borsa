// ESLint 9.x Flat Config
const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const security = require('eslint-plugin-security');
const node = require('eslint-plugin-node');

module.exports = [
  // Global ignores (must be standalone config object)
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      '.vercel/**',
      '*.min.js',
      'public/**',
      'apps/**',
      '.backups/**',
      'Desktop/**',
    ],
  },
  js.configs.recommended,
  prettier,
  {
    plugins: {
      security,
      node,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Node 18+ Web API globals
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        FormData: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        structuredClone: 'readonly',
        queueMicrotask: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        crypto: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        AbortSignal: 'readonly',
        // Jest globals (for test files)
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      // Best Practices
      'no-console': 'off', // Allow console for server-side
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'only-multiline'],

      // Security
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // Node.js
      'node/no-unsupported-features/es-syntax': 'off',
      'node/no-missing-require': 'off',
      'node/no-unpublished-require': 'off',
    },
  },
];
