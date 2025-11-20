function calcTimeNowOffset(offset) {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const nd = new Date(utc + (3600000 * offset));
    return nd;
}

function formatDate(input) {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const weekday = input.slice(0, 3);

  return `${year}/${month}/${day} ${weekday}`;
}

function mapNoteV2ToNoteV1(input) {
  const [parentId, tag] = input.parentId.split("::");

  const data = input.content?.date? JSON.stringify({json: true, date: input.content?.date, data: input.content.data}) : input.content.data;
  const person =  {person: {
    dataLable: {
      tag: tag,
      data: data
    },
    id: parentId
  }};
  if (input.edit) {
    person.person.dataLable["edit"] = person.person.dataLable["data"]
    person.person.dataLable["data"] = input.edit
  }
  
  return person
}

function mapNoteV1ToNoteV2Query(req){
    const body = req.body;
    const userId = req.auth.sub;
    const person = body.person
    const isNote = !person.dataLable.data.includes('"json":true')

    let parentId = person.id + "::" + person.dataLable.tag;
    let newContent = null;
    if(person.dataLable.edit){
        const jsonDataLableEdit = !isNote? JSON.parse(person.dataLable.edit): undefined;
        newContent = isNote? {data: person.dataLable.edit}: {data: jsonDataLableEdit.data, date: jsonDataLableEdit.date}
    }
    const jsonDataLableData = !isNote? JSON.parse(person.dataLable.data): undefined;
    const contentData = jsonDataLableData?.data ?? person.dataLable.data

    const logDay = jsonDataLableData?.date ? formatDate(jsonDataLableData.date.substring(0, 16).trim()) : null;
    if(logDay) parentId += "::" + logDay.trim().replaceAll(" ", "-");
    const queryParams = { parentId: parentId, userId: userId, "content.data": contentData };
    if (jsonDataLableData) queryParams["content.date"] = jsonDataLableData?.date;

    return {queryParams, newContent, parentId}
}

module.exports = {calcTimeNowOffset, formatDate, mapNoteV2ToNoteV1, mapNoteV1ToNoteV2Query};