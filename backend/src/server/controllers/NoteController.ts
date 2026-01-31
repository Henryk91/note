import { Request, Response } from 'express';
import { noteService } from '../services/NoteService';
import { websiteTrackingService } from '../services/WebsiteTrackingService';
import { NewV2NoteBody, UpdateV2NoteBody, DeleteV2NoteBody, SiteLogQuery } from '../types/models';

export class NoteController {
  async getNotes(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { user } = req.query as { user?: string };
      const decodedUser = user ? decodeURI(user) : '';

      if (decodedUser.toLowerCase() === 'all') {
        const result = await noteService.getNotes(userId);
        return res.json(result);
      } else {
        const { noteHeading } = req.query as { noteHeading?: string };

        if (noteHeading) {
          const result = await noteService.getNote(userId, user ?? '', noteHeading);
          return res.json(result);
        } else {
          const result = await noteService.getMyNotes(userId, user);
          return res.json(result);
        }
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async getNoteNames(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await noteService.getNoteNames(userId);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async saveNote(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await noteService.createNoteV1(userId, req.body);
      return res.json({ Ok: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Ok: 'Error' });
    }
  }

  async updateNote(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await noteService.updateNoteV1(userId, req.body.person);
      return res.json({ Ok: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ Ok: 'Error' });
    }
  }

  async updateOneNote(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await noteService.patchNoteV1(userId, req.body.person, req.body.delete);
      return res.json({ Ok: result });
    } catch (err) {
      console.error(err);
      return res.json({ Ok: 'Error' });
    }
  }

  async siteLog(req: Request, res: Response) {
    try {
      const result = await websiteTrackingService.logSiteVisit(req.headers, req.query as SiteLogQuery);
      return res.json({ Ok: result });
    } catch (err: unknown) {
      console.error('Log Error', err);
      const message = err instanceof Error ? err.message : 'fail';
      return res.json({ Ok: message });
    }
  }

  // V2 Endpoints

  async getV2Content(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const parentId = req.query.parentId as string;
      const result = await noteService.getNoteV2Content(userId, parentId);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.json('No notes');
    }
  }

  async getV2ContentWithChildren(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const parentId = req.query.parentId as string;
      const result = await noteService.getOneLevelDown(userId, parentId);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.json('No notes');
    }
  }

  async createV2(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const doc = await noteService.createNoteV2(userId, req.body as NewV2NoteBody);
      return res.json(doc);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Error');
    }
  }

  async updateV2(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const doc = await noteService.updateNoteV2(userId, req.body as UpdateV2NoteBody);
      return res.json(doc);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Error');
    }
  }

  async deleteV2(req: Request, res: Response) {
    try {
      const userId = req.auth?.sub;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await noteService.deleteNoteV2(userId, req.body as DeleteV2NoteBody);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).send('Error');
    }
  }
}

export const noteController = new NoteController();
