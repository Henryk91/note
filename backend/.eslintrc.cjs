module.exports = {
  root: true,
  env: {
    node: true,
    browser: false,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.test.json'],
  },
  plugins: ['@typescript-eslint', 'prettier', 'unused-imports'],
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier'],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'prettier/prettier': ['error', { singleQuote: true, 'printWidth': 120 }],
    'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }],
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off',
    'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'unused-imports/no-unused-imports': 'error',
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
  },
  overrides: [
    {
      files: ['__tests__/**/*.{ts,js}'],
      env: { mocha: true, jest: true, node: true },
      rules: {
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
      },
    },
  ],
};
