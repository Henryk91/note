import { folderLog, logMenuLabel, openOrCreateLog } from '../src/features/notes/edit/folderActions';
import { ItemType } from '../src/shared/utils/Helpers/types';

const folder = (id: string, name: string) => ({ id, parentId: 'f', type: ItemType.FOLDER, name }) as any;

describe('New log / Open log', () => {
  test('a folder without a Log: "New log" creates <folder>::Log and opens it', async () => {
    const create = jest.fn(async (_t: any, _x: any, id?: string) => id as string);
    const open = jest.fn();
    expect(logMenuLabel([folder('f::FOLDER::a', 'Work')])).toBe('New log');
    const id = await openOrCreateLog('f', [folder('f::FOLDER::a', 'Work')], { create } as any, open);
    expect(id).toBe('f::Log');
    expect(create).toHaveBeenCalledWith(ItemType.FOLDER, '', 'f::Log', { name: 'Log', heading: 'Log' });
    expect(open).toHaveBeenCalledWith('f::Log');
  });

  test('a folder that has a Log: "Open log" opens it and creates nothing', async () => {
    const items = [folder('f::FOLDER::a', 'Work'), folder('legacy-log-id', 'Log')];
    const create = jest.fn();
    const open = jest.fn();
    expect(folderLog(items)?.id).toBe('legacy-log-id');
    expect(logMenuLabel(items)).toBe('Open log');
    await openOrCreateLog('f', items, { create } as any, open);
    expect(create).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('legacy-log-id');
  });
});
