/*
 * A log is a FOLDER named "Log" (as in the old app and the backend). Logs the backend creates have the id
 * `<parent>::Log`, but older logs can have any id, so the ids of folders named "Log" are remembered as folder lists
 * load (cached or fetched) and recognised as well.
 */
const knownLogIds = new Set<string>();

type ListedItem = { id?: string; type?: string; name?: string };
/** Remember every folder named "Log" in a with-children result (`{ [id]: { heading, dataLable } }`). */
export const rememberLogFolders = (notes: Record<string, { heading?: string; dataLable?: ListedItem[] }> | null | undefined) => {
  if (!notes) return;
  Object.entries(notes).forEach(([id, doc]) => {
    if (doc?.heading === 'Log') knownLogIds.add(id);
    (doc?.dataLable ?? []).forEach((item) => {
      if (item?.id && item.type === 'FOLDER' && item.name === 'Log') knownLogIds.add(item.id);
    });
  });
};

export const isLogId = (id: string | undefined | null) => !!id && (/::Log$/.test(id) || knownLogIds.has(id));
