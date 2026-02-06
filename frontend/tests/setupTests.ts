import '@testing-library/jest-dom';

jest.mock('marked', () => ({
  marked: Object.assign((text: string) => text, {
    setOptions: jest.fn(),
    parse: (text: string) => text,
  }),
}));
