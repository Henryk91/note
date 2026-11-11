import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppDialogHost, askConfirm, askText } from '../src/shared/components/dialog/AppDialog';

describe('in-app dialog (replaces window.prompt / confirm)', () => {
  test('askText: typed value resolves trimmed; OK is disabled while empty; native prompt is not used', async () => {
    const native = jest.spyOn(window, 'prompt');
    render(<AppDialogHost />);
    let p!: Promise<string | null>;
    act(() => {
      p = askText({ title: 'New folder', label: 'Folder name', confirmLabel: 'Create' });
    });
    expect(screen.getByRole('dialog', { name: 'New folder' })).toBeTruthy();
    const create = screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Folder name'), { target: { value: '  Work  ' } });
    act(() => {
      fireEvent.click(create);
    });
    await expect(p).resolves.toBe('Work');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(native).not.toHaveBeenCalled();
    native.mockRestore();
  });

  test('askText with choices: tapping an existing notebook resolves it', async () => {
    render(<AppDialogHost />);
    let p!: Promise<string | null>;
    act(() => {
      p = askText({ title: 'Open or create notebook', choices: ['Henry', 'Koorvi'], choicesLabel: 'Your notebooks' });
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Koorvi' }));
    });
    await expect(p).resolves.toBe('Koorvi');
  });

  test('Escape and Cancel resolve null / false', async () => {
    render(<AppDialogHost />);
    let t!: Promise<string | null>;
    act(() => {
      t = askText({ title: 'Break words', initial: 'Break' });
    });
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    await expect(t).resolves.toBeNull();
    let c!: Promise<boolean>;
    act(() => {
      c = askConfirm({ title: 'Empty Recently Deleted?', confirmLabel: 'Delete all', danger: true });
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    await expect(c).resolves.toBe(false);
  });

  test('askConfirm resolves true on the confirm button', async () => {
    render(<AppDialogHost />);
    let c!: Promise<boolean>;
    act(() => {
      c = askConfirm({ title: 'Delete permanently?', message: 'This cannot be undone.', confirmLabel: 'Delete' });
    });
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });
    await expect(c).resolves.toBe(true);
  });
});
