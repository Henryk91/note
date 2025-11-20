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
    project: ['./tsconfig.server.json', './tsconfig.test.json'],
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier'],
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.server.json', './tsconfig.test.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    'prettier/prettier': ['error', { singleQuote: true }],
    'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }],
    'no-underscore-dangle': 'off',
  },
  overrides: [
    {
      files: ['src/client/**/*.{js,jsx}'],
      env: { browser: true, node: false, es2021: true, jest: true },
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
      plugins: ['react', 'prettier'],
      extends: ['airbnb', 'prettier'],
      rules: {
        'prettier/prettier': ['error', { singleQuote: true }],
        'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
        'react/forbid-prop-types': [0, { forbid: ['any'] }],
        'react/prop-types': 0,
        'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never' }],
        'class-methods-use-this': 'off',
      },
    },
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
