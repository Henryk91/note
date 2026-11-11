import { isLogId, rememberLogFolders } from '../src/features/notes/log/logIds';

// A log is a folder named "Log" (old app and backend), whatever its id. Production logs exist whose id does not end
// in "::Log"; they opened as an empty folder ("0 folders") although their row showed the entry count.
describe('log ids', () => {
  test('ids the backend creates are logs', () => {
    expect(isLogId('Koorvi::FOLDER::Track::Log')).toBe(true);
    expect(isLogId('Koorvi::FOLDER::Track')).toBe(false);
    expect(isLogId(null)).toBe(false);
  });

  test('a folder named "Log" with any other id is a log once a folder list containing it has loaded', () => {
    expect(isLogId('Koorvi::legacy-track-log')).toBe(false);
    rememberLogFolders({
      'Koorvi::FOLDER::Track': {
        heading: 'Track',
        dataLable: [
          { id: 'Koorvi::legacy-track-log', type: 'FOLDER', name: 'Log' },
          { id: 'Koorvi::FOLDER::Track::FOLDER::Logbook', type: 'FOLDER', name: 'Logbook' },
          { id: 'Koorvi::FOLDER::Track::NOTE::1', type: 'NOTE', name: 'Log' },
        ],
      },
    });
    expect(isLogId('Koorvi::legacy-track-log')).toBe(true);
    expect(isLogId('Koorvi::FOLDER::Track::FOLDER::Logbook')).toBe(false);
    expect(isLogId('Koorvi::FOLDER::Track::NOTE::1')).toBe(false);
  });

  test('the log folder itself (opened directly) is recognised from its own heading', () => {
    rememberLogFolders({ 'Henry::other-log': { heading: 'Log', dataLable: [] } });
    expect(isLogId('Henry::other-log')).toBe(true);
  });
});
