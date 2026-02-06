import { apiFetch } from '../../../shared/utils/Helpers/apiFetch';
import { Note, KeyValue } from '../../../shared/utils/Helpers/types';

export interface NotesResponse {
  notes: KeyValue<Note>; // Object with note IDs as keys
  noteNames: string[];
  selectedNoteName: string;
}

/**
 * Promise-based API layer for notes feature.
 * Replaces callback-based functions from requests.ts.
 */
export const notesApi = {
  /**
   * Fetch notes by parent ID
   */
  getNotesByParentId: async (parentId?: string): Promise<Note[]> => {
    const url = '/api/note-v2' + (parentId && parentId !== '' ? `?parentId=${parentId}` : '');
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch notes: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Fetch notes with children (includes nested structure)
   */
  getNotesWithChildren: async (parentId?: string): Promise<NotesResponse> => {
    // Check if offline - return empty response to prevent errors
    if (!navigator.onLine) {
      return { notes: {}, noteNames: [], selectedNoteName: '' };
    }

    const url = '/api/note-v2/with-children' + (parentId && parentId !== '' ? `?parentId=${parentId}` : '');
    const res = await apiFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch notes with children: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Create a new note
   */
  createNote: async (newNote: Partial<Note>): Promise<Note> => {
    const res = await apiFetch('/api/note-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote),
    });
    if (!res.ok) {
      throw new Error(`Failed to create note: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Update an existing note
   */
  updateNote: async (note: Note): Promise<Note> => {
    const res = await apiFetch('/api/note-v2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!res.ok) {
      throw new Error(`Failed to update note: ${res.status} ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Delete a note
   */
  deleteNote: async (note: Note): Promise<void> => {
    const res = await apiFetch('/api/note-v2', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (!res.ok) {
      throw new Error(`Failed to delete note: ${res.status} ${res.statusText}`);
    }
  },

  /**
   * Fetch note names (top-level notebooks)
   */
  getNoteNames: async (): Promise<string[]> => {
    const res = await apiFetch('/api/note-v2', {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch note names: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.map((item) => item.name);
  },
};
