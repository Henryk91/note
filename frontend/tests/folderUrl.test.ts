import { buildFolderChain, folderIdFromPath, pathForFolder } from '../src/features/notes/hooks/useFolderUrlSync';

describe('folder URLs', () => {
  test('builds the ancestor chain from a nested folder id', () => {
    expect(buildFolderChain('Henry::FOLDER::Train::FOLDER::Core')).toEqual([
      'Henry',
      'Henry::FOLDER::Train',
      'Henry::FOLDER::Train::FOLDER::Core',
    ]);
  });

  test('handles Log folders and resolves note / log item ids to their folder', () => {
    expect(buildFolderChain('Koorvi::FOLDER::Track::Log')).toEqual([
      'Koorvi',
      'Koorvi::FOLDER::Track',
      'Koorvi::FOLDER::Track::Log',
    ]);
    expect(buildFolderChain('Henry::FOLDER::Dev::NOTE::abc')).toEqual(['Henry', 'Henry::FOLDER::Dev']);
    expect(buildFolderChain('Henry')).toEqual(['Henry']);
    expect(buildFolderChain('Site Track::Site one')).toEqual(['Site Track', 'Site Track::Site one']);
    expect(buildFolderChain('EY4L::Log::LOG::13539')).toEqual(['EY4L', 'EY4L::Log']);
  });

  test('round-trips ids through /f/:id', () => {
    const id = 'Henry::FOLDER::My Folder';
    expect(folderIdFromPath(pathForFolder(id))).toBe(id);
    expect(folderIdFromPath('/n/Henry%3A%3AFOLDER%3A%3AA')).toBe('Henry::FOLDER::A');
    expect(folderIdFromPath('/notes/main')).toBeNull();
  });
});
