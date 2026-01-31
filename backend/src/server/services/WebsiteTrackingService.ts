import { IncomingHttpHeaders } from 'http';
import { NoteModel, NoteV2Model } from '../models/Notes';
import { docId, calcTimeNowOffset, referralToSiteName } from '../utils';
import config from '../config';
import { NoteV2Attrs, SiteLogQuery, NoteDoc } from '../types/models';

export class WebsiteTrackingService {
  async logSiteVisit(headers: IncomingHttpHeaders, query: SiteLogQuery) {
    const { logSitesNoteId } = config;
    const userId = config.adminUserId;

    if (!logSitesNoteId || !userId) {
      throw new Error('Log sites not configured');
    }

    // Check V1 Doc (Legacy tracking?)
    let doc = (await NoteModel.findOne({
      id: logSitesNoteId,
      userId,
    })) as NoteDoc | null;

    if (!doc) {
      doc = new NoteModel({
        id: logSitesNoteId,
        userId,
        dataLable: [],
      }) as NoteDoc;
    }
    if (!doc.dataLable) {
      doc.dataLable = [];
    }

    doc.heading = 'Site Track';
    const rawReferer = headers.referer;
    const referer = Array.isArray(rawReferer)
      ? rawReferer[0]
      : (rawReferer ?? '');

    if (
      referer &&
      config.siteLogSkipReferrers &&
      config.siteLogSkipReferrers.some((entry: string) =>
        referer.includes(entry),
      )
    ) {
      throw new Error(`Not logged: ${referer}`);
    }

    const ip = headers['x-forwarded-for'] || headers['x-real-ip'];
    const clientIp = Array.isArray(ip) ? ip[0] : (ip ?? '');

    if (
      clientIp &&
      config.siteLogSkipIp &&
      config.siteLogSkipIp.some((entry: string) => clientIp.includes(entry))
    ) {
      throw new Error(`Not logged IP: ${clientIp}`);
    }

    let data = `Referer: ${referer}\nIp: ${clientIp}\n SA Date: ${calcTimeNowOffset('+2')}\n https://ipapi.co/${clientIp}/`;
    let siteTag = 'Site one';
    if (referer) {
      const siteName = referralToSiteName(referer);
      if (siteName) {
        siteTag = siteName;
      }
    }

    const websiteName = query?.site || '';
    if (websiteName) siteTag = websiteName;

    try {
      const ipData = await fetch(
        `http://ip-api.com/json/${clientIp}?fields=country,regionName,city,timezone,org`,
      );
      const ipDataJson = await ipData.json();

      if (ipDataJson && ipDataJson.country) {
        data += `\nCountry: ${ipDataJson.country}\nRegion: ${ipDataJson.regionName}\nCity: ${ipDataJson.city}\nTimezone: ${ipDataJson.timezone}\nOrg: ${ipDataJson.org}`;
      }
    } catch (err) {
      console.error('IP Fetch failed', err);
    }

    doc.dataLable.push({ tag: siteTag, data });

    const parentId = `${logSitesNoteId}::${siteTag}`;

    await this.ensureFolderExists(userId, siteTag, parentId, logSitesNoteId);

    const noteV2Id = `${parentId}::NOTE::${docId(10)}`;
    const note: NoteV2Attrs = {
      id: noteV2Id,
      parentId,
      type: 'NOTE',
      content: { data },
      userId,
    };

    const createNote = new NoteV2Model(note);
    await createNote.save();
    await doc.save();
    return 'success';
  }

  private async ensureFolderExists(
    userId: string,
    folderName: string,
    folderId: string,
    parentId: string,
  ) {
    const parentData = await NoteV2Model.findOne({
      userId,
      id: folderId,
    });
    if (!parentData) {
      const folder: NoteV2Attrs = {
        name: folderName,
        id: folderId,
        parentId,
        type: 'FOLDER',
        userId,
      };
      const createHighLevelFolder = new NoteV2Model(folder);
      await createHighLevelFolder.save();
    }
  }
}

export const websiteTrackingService = new WebsiteTrackingService();
