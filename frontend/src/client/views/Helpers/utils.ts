import { ItemType, Note, NoteItemType, NoteItemMap, NoteLabel } from './types';

export const docId = (): string => {
  let text = '';

  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 20; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const getPersonNoteType = (
  notes: Note[] | null,
  propForId: any,
  selectedNoteName?: string
): Note  | null => {
  // console.log('notes',notes);
  const personFound = notes?.filter((val) => val.id === propForId?.params.id)?.[0];
  let person = personFound? {... personFound}: null
  if (person?.id === selectedNoteName && person?.dataLable) {
    person.dataLable = person.dataLable.filter((note) => !note.tag.startsWith('Sub: '));
  }
  return person;
};

export const getPerson = (
  notes: Note[] | null,
  propForId: any,
  propNoteNames: string[] | null,
): Note | string[] | undefined | null => {
  if (propForId === 'note-name') {
    return propNoteNames;
  }
  const personFound = notes?.filter((val) => val.id === propForId?.params.id)?.[0];
  let person = personFound? {... personFound}: undefined
  if (person?.id === 'main' && person.dataLable) {
    person.dataLable = person.dataLable.filter((note) => !note.tag.startsWith('Sub: '));
  }
  return person;
};

export const compareSort = (a: Note, b: Note): number => {
  const nameA = a.heading.toUpperCase();
  const nameB = b.heading.toUpperCase();

  if (nameA > nameB) return 1;
  if (nameA < nameB) return -1;
  return 0;
};

const checkIsToday = (dateString: string): boolean => {
  const today = new Date();
  const someDate = new Date(dateString);
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

export const getLogDuration = (nextItem: NoteItemType, parsedItem: NoteLabel) => {
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

  let nextDate = parsedNextItem ? parsedNextItem.date : null;

  if (!nextDate) {
    if (checkIsToday(parsedItem.date || '')) {
      nextDate = `${new Date()}`;
    }
  }

  const duration = nextDate ? `(${getTimeDifference(parsedItem.date || '', nextDate)})` : '';
  return duration;
};

function formatDate(input: string): string {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Extract the weekday from the original input (first 3 chars)
  const weekday = input.slice(0, 3);

  return `${year}/${month}/${day} ${weekday}`;
}

function convertDataLableToType(item, label, userId, newNotes, subSubFolderNames) {
      let forReturn: {newLogDay?: any, subSubFolder?: NoteItemType, newNote?: NoteItemType} = {}
        const subSubFolderId = (item.id + "::" + label.tag).replaceAll(" ", "-");
        if (!subSubFolderNames.includes(label.tag)) {
          subSubFolderNames.push(label.tag);
          const subSubFolder: NoteItemType = {
            userId,
            id: label.data.startsWith("href:") ? label.data.replace("href:", "") : subSubFolderId,
            // name: label.tag === "" || !label.tag ? "1Unnamed" : label.tag,
            name:  label?.tag+"",//+"-test",
            parentId: item.id,
            type: ItemType.FOLDER,
            // tag: label.tag,
          };
          // newFolders.push(subSubFolder);
          forReturn = {subSubFolder}
        }
        let content = { data: label.data, date: item.date };
        let noteType = ItemType.NOTE;
  
        let parentId = subSubFolderId;
        if (label.data.includes('"json":true')) {
          noteType = ItemType.LOG;
          const jsonData = label.data ? JSON.parse(label.data) : { data: "", date: "" };
          content = { data: jsonData.data, date: jsonData.date };
          // const logDay = jsonData.date ? formatDate(jsonData.date.substring(0, 16).trim()) : "unknown";
  
          // const logDayId = (subSubFolderId + "::" + logDay).trim().replaceAll(" ", "-");
          const logDayId = (subSubFolderId ).trim().replaceAll(" ", "-");
  
          // const newLogDay = {
          //   userId,
          //   id: logDayId,
          //   name: logDay,
          //   parentId: subSubFolderId,
          //   type: ItemType.FOLDER,
          //   tag: label.tag,
          //   data: label.data
          // };
          // logDays[logDayId] = newLogDay
          // forReturn = {...forReturn, newLogDay}
          parentId = logDayId;

        }
        const newNote: NoteItemType = {
          userId,
          id: parentId + "::" + noteType + "::" + newNotes.length.toString(),
          content: content,
          parentId: parentId,
          type: noteType,
          // tag: label.tag,
          data: label.data
        };
        // logDays
        if (!label.data.startsWith("href:")) {
          // newNotes.push(newNote);
          forReturn = {...forReturn, newNote}
        }
      return forReturn
    }

export function processGetAllNotesA(data: any) {
  let logDays: any = {};
  let createdByList: string[] = [];
  let newFolders: NoteItemType[] = [];
  let newNotes: NoteItemType[] = [];
  const userId = localStorage.getItem("userId") ?? "";
  data?.forEach((item: any) => {
    if (!createdByList.includes(item.createdBy)) {
      const mainFolder: NoteItemType = {
        userId,
        id: item.createdBy,
        name: item.createdBy,
        parentId: "",
        type: ItemType.FOLDER,
      };
      newFolders.push(mainFolder);
      createdByList.push(item.createdBy);
    }

    if (!item.heading?.startsWith("Sub: ")) {
      const subFolder: NoteItemType = {
        userId,
        id: item.id,
        name: item.heading === "" ? "Unnamed" : item.heading,
        parentId: item.createdBy,
        type: ItemType.FOLDER,
      };
      newFolders.push(subFolder);
    }

    let subSubFolderNames: string[] = [];
    item?.dataLable.forEach((label: any) => {
      const subSubFolderId = (item.id + "::" + label.tag).replaceAll(" ", "-");
      if (!subSubFolderNames.includes(label.tag)) {
        subSubFolderNames.push(label.tag);
        const subSubFolder: NoteItemType = {
          userId,
          id: label.data.startsWith("href:") ? label.data.replace("href:", "") : subSubFolderId,
          // name: label.tag === "" || !label.tag ? "Unnamed" : label.tag,
          name:  label?.tag+"",//+"-test",
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
        const jsonData = label.data ? JSON.parse(label.data) : { data: "", date: "" };
        content = { data: jsonData.data, date: jsonData.date };
        // const logDay = jsonData.date ? formatDate(jsonData.date.substring(0, 16).trim()) : "unknown";

        // const logDayId = (subSubFolderId + "::" + logDay).trim().replaceAll(" ", "-");
        const logDayId = (subSubFolderId ).trim().replaceAll(" ", "-");

        // logDays[logDayId] = {
        //   userId,
        //   id: logDayId,
        //   name: logDay,
        //   parentId: subSubFolderId,
        //   type: ItemType.FOLDER,
        // };

        parentId = logDayId;
      }
      const newNote: NoteItemType = {
        userId,
        id: parentId + "::" + noteType + "::" + newNotes.length.toString(),
        content: content,
        parentId: parentId,
        type: noteType,
      };
      // logDays
      if (!label.data.startsWith("href:")) {
        newNotes.push(newNote);
      }
    });
  });
  if (newFolders?.length) {
    const logDayFolders: NoteItemType[] = Object.values(logDays);

    const sortedLogDayFolders = logDayFolders.sort((a, b) => (b?.name ?? "").localeCompare(a?.name ?? ""));
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
  const userId = localStorage.getItem("loginKey") ?? "";
  data?.forEach((item: any) => {
    // console.log('item',item);
    if (!createdByList.includes(item.createdBy)) {
      const mainFolder: NoteItemType = {
        userId,
        id: item.createdBy,
        name: item.createdBy,
        parentId: "",
        type: ItemType.FOLDER,
      };
      newFolders.push(mainFolder);
      createdByList.push(item.createdBy);
    }

    if (!item.heading?.startsWith("Sub: ")) {
      const subFolder: NoteItemType = {
        userId,
        id: item.id,
        data: "href:" + item.id,
        name: item.heading === "" ? "Unnamed" : item.heading +"",
        // tag: item.heading === "" ? "Unnamed" : item.heading,
        parentId: item.createdBy,
        type: ItemType.FOLDER,
      };
      newFolders.push(subFolder);
    }

    let subSubFolderNames: string[] = [];
    item?.dataLable.forEach((label: any) => {
      const vals = convertDataLableToType(item, label, userId, newNotes, subSubFolderNames)
      // console.log('vals',vals);
      if (vals?.newNote) newNotes.push(vals.newNote)
      if (vals?.subSubFolder) newFolders.push(vals.subSubFolder);
      if (vals?.newLogDay) logDays[vals?.newLogDay.id] = vals?.newLogDay
    });
  });

  // console.log('logDays',logDays);
  if (newFolders?.length) {
    const logDayFolders: NoteItemType[] = Object.values(logDays);

    const sortedLogDayFolders = logDayFolders.sort((a, b) => (b?.name ?? "").localeCompare(a?.name ?? ""));
    const itemsToSet = [...newFolders, ...newNotes, ...sortedLogDayFolders];
    // console.log('itemsToSet',itemsToSet);
    return itemsToSet;
  }
  return [];
}

export function allNotesToItems(data: NoteItemType[]) {
  let items: NoteItemMap =  {}
  // let folderid = ''
  // console.log('data[0]',data[0]);
  data.forEach(d => {
    // if(d.name === 'New New') folderid = d.parentId
    if(items[d.parentId]) {
      items[d.parentId].dataLable.push(d)
    }else {
      const parent = data.find(e => e.id === d.parentId)
      items[d.parentId] = {id: d.parentId,  dataLable: [d], heading: parent?.name ?? "Main" }
      // const heading = typeof parent?.name === 'string' ? parent?.name: "Main"
      // console.log('parent',parent);
      // items[d.parentId] = {id: d.parentId,  dataLable: [d], heading: heading }
    }
  })
  // console.log(folderid, 'items[folderid]',items[folderid]);
  return items
}