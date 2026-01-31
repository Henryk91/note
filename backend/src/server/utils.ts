import { NoteAttrs, NotePersonUpdate, NoteV2Attrs, NoteV2Content } from './types/models';

export function calcTimeNowOffset(offset: number | string): Date {
  const offsetNum = typeof offset === 'number' ? offset : Number(offset);
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * offsetNum);
}

export function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = input.slice(0, 3);
  return `${year}/${month}/${day} ${weekday}`;
}

export function docId(count: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < count; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function referralToSiteName(referer: string): string {
  const siteName = referer.replace('http://', '').replace('https://', '');
  const slashIndex = siteName.indexOf('/');
  return slashIndex === -1 ? siteName : siteName.substring(0, slashIndex);
}

export function onlyUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}

export interface MapV1Result {
  person?: NotePersonUpdate;
  id?: string;
  createdBy?: string;
  heading?: string;
  dataLable?: any[];
}

export function mapNoteV2ToNoteV1(input: NoteV2Attrs & { edit?: string }): MapV1Result {
  const [parentId, tag] = input.parentId.split('::');

  const data = input.content?.date
    ? JSON.stringify({
        json: true,
        date: input.content.date,
        data: input.content.data,
      })
    : input.content?.data || '';

  if (input.type === 'FOLDER') {
    return {
      id: input.id,
      createdBy: parentId || input.id,
      heading: input.name || input.id,
      dataLable: [],
    };
  }

  const result: MapV1Result = {
    person: {
      id: parentId || input.parentId,
      dataLable: {
        tag: tag || '',
        data,
      },
    },
  };

  if (input.edit && result.person) {
    result.person.dataLable.edit = result.person.dataLable.data;
    result.person.dataLable.data = input.edit;
  }

  return result;
}

// Keeping this as any for now as it's very dynamic and old legacy logic
export function mapNoteV1ToNoteV2Query(req: any): {
  queryParams: any;
  newContent: any;
  parentId: string;
} {
  const body = req.body;
  const userId = req.auth.sub;
  const person = body.person;
  const isNote = !person.dataLable.data.includes('"json":true');

  const parentId = `${person.id}::${person.dataLable.tag}`;
  let newContent: any = null;
  if (person.dataLable.edit) {
    const jsonDataLableEdit = !isNote ? JSON.parse(person.dataLable.edit) : undefined;
    newContent = isNote
      ? { data: person.dataLable.edit }
      : { data: jsonDataLableEdit.data, date: jsonDataLableEdit.date };
  }
  const jsonDataLableData = !isNote ? JSON.parse(person.dataLable.data) : undefined;
  const contentData = jsonDataLableData?.data ?? person.dataLable.data;

  const queryParams: any = { parentId, userId, 'content.data': contentData };
  if (jsonDataLableData) queryParams['content.date'] = jsonDataLableData?.date;

  return { queryParams, newContent, parentId };
}
