/* eslint-env node */
module.exports = {
  preset: 'ts-jest',
  rootDir: __dirname,
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: ['\\\\node_modules\\\\'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@fortawesome|marked))'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  verbose: false,
};
