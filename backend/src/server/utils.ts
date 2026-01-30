export function calcTimeNowOffset(offset: number | string): Date {
  const offsetNum = typeof offset === 'number' ? offset : Number(offset);
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const nd = new Date(utc + 3600000 * offsetNum);
  return nd;
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

export function onlyUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}

export type NoteV2Content = {
  data: string;
  date?: string;
  tag?: string;
};

export type NoteV2Shape = {
  id: string;
  parentId: string;
  content: NoteV2Content;
  edit?: string;
  type?: string;
};

export function mapNoteV2ToNoteV1(input: NoteV2Shape): any {
  const [parentId, tag] = input.parentId.split('::');

  const data = input.content?.date
    ? JSON.stringify({
        json: true,
        date: input?.content?.date,
        data: input?.content?.data,
      })
    : input.content?.data;

  const person: any = {
    person: {
      dataLable: {
        tag,
        data,
      },
      id: parentId,
    },
  };
  if (input.edit) {
    person.person.dataLable.edit = person.person.dataLable.data;
    person.person.dataLable.data = input.edit;
  }
  if (input.type === 'FOLDER') {
    return {
      id: input.id,
      createdBy: parentId,
      heading: input.content?.tag,
      dataLable: [],
    };
  }

  return person;
}

export function mapNoteV1ToNoteV2Query(req: any): {
  queryParams: any;
  newContent: any;
  parentId: string;
} {
  const body = req.body;
  const userId = req.auth.sub;
  const person = body.person;
  const isNote = !person.dataLable.data.includes('"json":true');

  let parentId = `${person.id}::${person.dataLable.tag}`;
  let newContent: any = null;
  if (person.dataLable.edit) {
    const jsonDataLableEdit = !isNote ? JSON.parse(person.dataLable.edit) : undefined;
    newContent = isNote
      ? { data: person.dataLable.edit }
      : { data: jsonDataLableEdit.data, date: jsonDataLableEdit.date };
  }
  const jsonDataLableData = !isNote ? JSON.parse(person.dataLable.data) : undefined;
  const contentData = jsonDataLableData?.data ?? person.dataLable.data;

  // const logDay = jsonDataLableData?.date ? formatDate(jsonDataLableData.date.substring(0, 16).trim()) : null;
  // if (logDay) parentId += `::${logDay.trim().replaceAll(' ', '-')}`;
  const queryParams: any = { parentId, userId, 'content.data': contentData };
  if (jsonDataLableData) queryParams['content.date'] = jsonDataLableData?.date;

  return { queryParams, newContent, parentId };
}
