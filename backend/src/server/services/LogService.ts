import { NoteModel, NoteV2Model } from '../models/Notes';
import { docId, calcTimeNowOffset } from '../utils';
import config from '../config';
import { NoteV2Attrs } from '../types/models';

export class LogService {
  async logSiteVisit(headers: any, query: any) {
    const sitesId = 'KdE0rnAoFwb7BaRJgaYd';
    const userId = '68988da2b947c4d46023d679';

    // Check V1 Doc (Legacy tracking?)
    let doc = await NoteModel.findOne({ id: sitesId, userId });

    if (!doc) {
      doc = new NoteModel({ id: sitesId, userId, dataLable: [] });
    }
    if (!doc.dataLable) {
      doc.dataLable = [];
    }

    doc.heading = 'Site Track';
    const rawReferer = headers.referer;
    const referer = Array.isArray(rawReferer) ? rawReferer[0] : (rawReferer ?? '');

    if (
      referer &&
      config.siteLogSkipReferers &&
      config.siteLogSkipReferers.some((entry: string) => referer.includes(entry))
    ) {
      throw new Error(`Not logged: ${referer}`);
    }

    const ip = headers['x-forwarded-for'] || headers.remoteAddress;

    if (ip && config.siteLogSkipIp && config.siteLogSkipIp.some((entry: string) => ip.includes(entry))) {
      throw new Error(`Not logged IP: ${ip}`);
    }

    let data = `Referer: ${referer}\nIp: ${ip}\n SA Date: ${calcTimeNowOffset('+2')}\n https://ipapi.co/${ip}/`;
    let siteTag = 'Site one';
    if (referer) {
      const siteName = `${referer.replace('http://', '').replace('https://', '')}`;
      if (siteName) {
        siteTag = siteName.substring(0, siteName.indexOf('/'));
      }
    }
    const websiteName = query && query.site ? query.site : '';
    if (websiteName && websiteName !== '') siteTag = websiteName;

    try {
      const ipData = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,timezone,org`);
      const ipDataJson = await ipData.json();

      if (ipDataJson && ipDataJson.country) {
        data += `\nCountry: ${ipDataJson.country}\nRegion: ${ipDataJson.regionName}\nCity: ${ipDataJson.city}\nTimezone: ${ipDataJson.timezone}\nOrg: ${ipDataJson.org}`;
      }
    } catch (err) {
      console.error('IP Fetch failed', err);
    }

    doc.dataLable.push({ tag: siteTag, data });

    const parentId = `KdE0rnAoFwb7BaRJgaYd::${siteTag}`;

    await this.ensureFolderExists(userId, siteTag, parentId, sitesId);

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

  private async ensureFolderExists(userId: string, folderName: string, folderId: string, parentId: string) {
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

export const logService = new LogService();
