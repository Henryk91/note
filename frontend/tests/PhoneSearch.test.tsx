import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../src/test-utils';
import { PhoneSearch } from '../src/features/notes/components/SearchBar/SearchResults';

jest.mock('../src/shared/utils/Helpers/apiFetch', () => ({
  apiFetch: jest.fn(async () => ({ ok: true, json: async () => [] })),
}));

describe('phone page search (the field is the input)', () => {
  test('typing in the page field shows results under it; × clears it', () => {
    renderWithProviders(<PhoneSearch label="Search Henry" />);
    const input = screen.getByLabelText('Search Henry') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    fireEvent.change(input, { target: { value: 'Break' } });
    expect(screen.getByRole('listbox', { name: 'Search results' }).className).toContain('is-inline');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input.value).toBe('');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
