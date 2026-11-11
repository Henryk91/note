import { ItemType, NoteItemType } from '../../../shared/utils/Helpers/types';
import { askText } from '../../../shared/components/dialog/AppDialog';
import type { ItemMutations } from './itemMutations';

/** A folder has at most one log: its child FOLDER named "Log" (id `<folder>::Log`, as the backend creates it). */
export const folderLog = (items: NoteItemType[] | undefined): NoteItemType | undefined =>
  (items ?? []).find((i) => i.type === ItemType.FOLDER && i.name === 'Log');

/** "New log" when the folder has none, otherwise "Open log". */
export const logMenuLabel = (items: NoteItemType[] | undefined) => (folderLog(items) ? 'Open log' : 'New log');

/** Opens the folder's log, creating it first when there is none. Returns the log's id. */
export const openOrCreateLog = async (
  folderId: string,
  items: NoteItemType[] | undefined,
  mutations: Pick<ItemMutations, 'create'>,
  open: (logId: string) => void,
): Promise<string> => {
  const found = folderLog(items);
  if (found) {
    open(found.id);
    return found.id;
  }
  const id = await mutations.create(ItemType.FOLDER, '', `${folderId}::Log`, { name: 'Log', heading: 'Log' } as Partial<NoteItemType>);
  open(id);
  return id;
};

/** Asks for a name and creates a sub-folder. */
export const askAndCreateFolder = async (mutations: Pick<ItemMutations, 'create'>) => {
  const name = await askText({ title: 'New folder', label: 'Folder name', placeholder: 'e.g. Work', confirmLabel: 'Create' });
  if (name) await mutations.create(ItemType.FOLDER, '', undefined, { name, heading: name } as Partial<NoteItemType>);
};
