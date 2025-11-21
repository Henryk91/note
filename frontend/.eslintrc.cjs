module.exports = {
  root: true,
  env: {
    browser: true,
    node: false,
    es2021: true,
    jest: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2021,
    sourceType: 'module',
    babelOptions: {
      presets: ['@babel/preset-env', '@babel/preset-react'],
    },
  },
  plugins: ['react', 'prettier', 'unused-imports'],
  extends: ['airbnb', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx'],
      },
    },
  },
  rules: {
    'prettier/prettier': ['error', { singleQuote: true }],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/forbid-prop-types': [0, { forbid: ['any'] }],
    'react/prop-types': 0,
    'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never' }],
    'class-methods-use-this': 'off',
    'react/button-has-type': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
    'no-plusplus': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'unused-imports/no-unused-vars': 'error',
    'unused-imports/no-unused-imports': 'error',
  },
};
