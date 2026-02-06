import { ItemType, Note, NoteItemType, NoteItemMap, NoteLabel, NoteContent, KeyValue } from './types';

export const generateDocId = (count: number = 20): string => {
  let text = '';

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < count; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const compareSort = (a: Note, b: Note): number => {
  const nameA = a.heading.toUpperCase();
  const nameB = b.heading.toUpperCase();

  if (nameA > nameB) return 1;
  if (nameA < nameB) return -1;
  return 0;
};

export const checkIsSameDate = (dateOne: Date, dateTwo: Date): boolean => {
  return (
    dateTwo.getDate() === dateOne.getDate() &&
    dateTwo.getMonth() === dateOne.getMonth() &&
    dateTwo.getFullYear() === dateOne.getFullYear()
  );
};

const checkIsSameDay = (dateOne: string, dateTwo: string): boolean => {
  const today = new Date(dateOne);
  const someDate = new Date(dateTwo);
  return checkIsSameDate(today, someDate);
};

const checkIsToday = (dateString: string): boolean => {
  const today = new Date();
  return checkIsSameDay(today.toString(), dateString);
};

export const getLogDuration = (nextItem: NoteItemType | undefined | null, parsedItem: NoteContent) => {
  const parsedNextItem = nextItem ? nextItem : null;

  const getTimeDifference = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();
    let minutes: number | string = Math.floor((duration / (1000 * 60)) % 60);
    let hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${minutes}`;
  };

  let nextDate = parsedNextItem ? parsedNextItem?.content?.date : null;

  if (!nextDate) {
    if (checkIsToday(parsedItem.date || '')) {
      nextDate = `${new Date()}`;
    }
  }

  if (!parsedItem.date || !nextDate || !checkIsSameDay(parsedItem.date, nextDate)) return;

  const duration = nextDate ? `(${getTimeDifference(parsedItem.date || '', nextDate)})` : '';
  return duration;
};

function formatDate(input: string): string {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Extract the weekday from the original input (first 3 chars)
  const weekday = input.slice(0, 3);

  return `${year}/${month}/${day} ${weekday}`;
}

function convertDataLableToType(item, label, userId, newNotes, subSubFolderNames) {
  let forReturn: { newLogDay?: any; subSubFolder?: NoteItemType; newNote?: NoteItemType } = {};
  const subSubFolderId = (item.id + '::' + label.tag).replaceAll(' ', '-');
  if (!subSubFolderNames.includes(label.tag)) {
    subSubFolderNames.push(label.tag);
    const subSubFolder: NoteItemType = {
      userId,
      id: label.data.startsWith('href:') ? label.data.replace('href:', '') : subSubFolderId,
      name: label?.tag + '',
      parentId: item.id,
      type: ItemType.FOLDER,
    };

    forReturn = { subSubFolder };
  }
  let content = { data: label.data, date: item.date };
  let noteType = ItemType.NOTE;

  let parentId = subSubFolderId;
  if (label.data.includes('"json":true')) {
    noteType = ItemType.LOG;
    const jsonData = label.data ? JSON.parse(label.data) : { data: '', date: '' };
    content = { data: jsonData.data, date: jsonData.date };
    const logDayId = subSubFolderId.trim().replaceAll(' ', '-');
    parentId = logDayId;
  }
  const newNote: NoteItemType = {
    userId,
    id: parentId + '::' + noteType + '::' + newNotes.length.toString(),
    content: content,
    parentId: parentId,
    type: noteType,
  };
  // logDays
  if (!label.data.startsWith('href:')) {
    forReturn = { ...forReturn, newNote };
  }
  return forReturn;
}

export function processGetAllNotesA(data: any) {
  let logDays: any = {};
  let createdByList: string[] = [];
  let newFolders: NoteItemType[] = [];
  let newNotes: NoteItemType[] = [];
  const userId = localStorage.getItem('userId') ?? '';
  data?.forEach((item: any) => {
    if (!createdByList.includes(item.createdBy)) {
      const mainFolder: NoteItemType = {
        userId,
        id: item.createdBy,
        name: item.createdBy,
        parentId: '',
        type: ItemType.FOLDER,
      };
      newFolders.push(mainFolder);
      createdByList.push(item.createdBy);
    }

    if (!item.heading?.startsWith('Sub: ')) {
      const subFolder: NoteItemType = {
        userId,
        id: item.id,
        name: item.heading === '' ? 'Unnamed' : item.heading,
        parentId: item.createdBy,
        type: ItemType.FOLDER,
      };
      newFolders.push(subFolder);
    }

    let subSubFolderNames: string[] = [];
    item?.dataLable.forEach((label: any) => {
      const subSubFolderId = (item.id + '::' + label.tag).replaceAll(' ', '-');
      if (!subSubFolderNames.includes(label.tag)) {
        subSubFolderNames.push(label.tag);
        const subSubFolder: NoteItemType = {
          userId,
          id: label.data.startsWith('href:') ? label.data.replace('href:', '') : subSubFolderId,
          name: label?.tag + '',
          parentId: item.id,
          type: ItemType.FOLDER,
        };
        newFolders.push(subSubFolder);
      }
      let content = { data: label.data, date: item.date };
      let noteType = ItemType.NOTE;

      let parentId = subSubFolderId;
      if (label.data.includes('"json":true')) {
        noteType = ItemType.LOG;
        const jsonData = label.data ? JSON.parse(label.data) : { data: '', date: '' };
        content = { data: jsonData.data, date: jsonData.date };
        const logDayId = subSubFolderId.trim().replaceAll(' ', '-');
        parentId = logDayId;
      }
      const newNote: NoteItemType = {
        userId,
        id: parentId + '::' + noteType + '::' + newNotes.length.toString(),
        content: content,
        parentId: parentId,
        type: noteType,
      };
      // logDays
      if (!label.data.startsWith('href:')) {
        newNotes.push(newNote);
      }
    });
  });
  if (newFolders?.length) {
    const logDayFolders: NoteItemType[] = Object.values(logDays);

    const sortedLogDayFolders = logDayFolders.sort((a, b) => (b?.name ?? '').localeCompare(a?.name ?? ''));
    const itemsToSet = [...newFolders, ...newNotes, ...sortedLogDayFolders];
    return itemsToSet;
  }
  return [];
}

export function processGetAllNotes(data: any): NoteItemType[] {
  let logDays: any = {};
  let createdByList: string[] = [];
  let newFolders: NoteItemType[] = [];
  let newNotes: NoteItemType[] = [];
  const userId = localStorage.getItem('loginKey') ?? '';
  data?.forEach((item: any) => {
    if (!createdByList.includes(item.createdBy)) {
      const mainFolder: NoteItemType = {
        userId,
        id: item.createdBy,
        name: item.createdBy,
        parentId: '',
        type: ItemType.FOLDER,
      };
      newFolders.push(mainFolder);
      createdByList.push(item.createdBy);
    }

    if (!item.heading?.startsWith('Sub: ')) {
      const subFolder: NoteItemType = {
        userId,
        id: item.id,
        name: item.heading === '' ? 'Unnamed' : item.heading + '',
        parentId: item.createdBy,
        type: ItemType.FOLDER,
      };
      newFolders.push(subFolder);
    }

    let subSubFolderNames: string[] = [];
    item?.dataLable.forEach((label: any) => {
      const vals = convertDataLableToType(item, label, userId, newNotes, subSubFolderNames);
      if (vals?.newNote) newNotes.push(vals.newNote);
      if (vals?.subSubFolder) newFolders.push(vals.subSubFolder);
      if (vals?.newLogDay) logDays[vals?.newLogDay.id] = vals?.newLogDay;
    });
  });

  if (newFolders?.length) {
    const logDayFolders: NoteItemType[] = Object.values(logDays);

    const sortedLogDayFolders = logDayFolders.sort((a, b) => (b?.name ?? '').localeCompare(a?.name ?? ''));
    const itemsToSet = [...newFolders, ...newNotes, ...sortedLogDayFolders];
    return itemsToSet;
  }
  return [];
}

export function allNotesToItems(data: NoteItemType[]) {
  let items: NoteItemMap = {};

  data.forEach((d) => {
    if (items[d.parentId]) {
      items[d.parentId].dataLable.push(d);
    } else {
      const parent = data.find((e) => e.id === d.parentId);
      items[d.parentId] = { id: d.parentId, dataLable: [d], heading: parent?.name ?? 'Main' };
    }
  });
  return items;
}

export const createInitPage = (selectedNoteName?: string) => {
  return { params: { id: selectedNoteName ?? 'main', tempId: selectedNoteName ?? 'main' } };
};

export const getStorageJsonData = (key: string, defaultValue?: any) => {
  const stringData = localStorage.getItem(key);
  if (stringData) return JSON.parse(stringData);
  return defaultValue;
};

export const setLogDirAtTop = (person: Note) => {
  const logFolder = person?.dataLable?.find((d) => d.name === 'Log');
  if (!logFolder) return person;
  return {
    ...person,
    dataLable: [logFolder, ...person?.dataLable?.filter((d) => d?.name !== 'Log')],
  };
};

export const setPersonDataToLocalStorage = (
  freshState: KeyValue<Note>,
  selectedNoteName?: string,
  noteNames?: string[],
) => {
  if (selectedNoteName && freshState) {
    const storageKey = `${selectedNoteName}-data`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(freshState));
    } catch (error) {
      console.error('QuotaExceededError. Clearing data stored.', error);
      noteNames?.forEach((key: string) => {
        localStorage.removeItem(key + '-data');
      });
      localStorage.setItem(storageKey, JSON.stringify(freshState));
    }
  }
};
