import { Request, Response } from 'express';
import { z } from 'zod'; // Assuming we can use zod, or just use types.
// Project uses zod in jwt-setup.ts
import { noteService } from '../services/NoteService';
import { logService } from '../services/LogService';

const getNoteSchema = z.object({
  user: z.string().optional(),
  noteHeading: z.string().optional(),
});

export class NoteController {
  async getNotes(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const { user } = req.query as { user?: string };
      const decodedUser = user ? decodeURI(user) : '';

      if (decodedUser.toLowerCase() === 'all') {
        const result = await noteService.getNotes(userId);
        res.json(result);
      } else {
        const { noteHeading } = req.query as { noteHeading?: string };

        if (noteHeading) {
          const result = await noteService.getNote(userId, user ?? '', noteHeading);
          res.json(result);
        } else {
          const result = await noteService.getMyNotes(userId, user);
          res.json(result);
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getNoteNames(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const result = await noteService.getNoteNames(userId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async saveNote(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const result = await noteService.createNoteV1(userId, req.body);
      res.json({ Ok: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Ok: 'Error' });
    }
  }

  async updateNote(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const result = await noteService.updateNoteV1(userId, req.body.person);
      res.json({ Ok: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ Ok: 'Error' });
    }
  }

  async updateOneNote(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      // Clean up body structure - handler expected `req.body.person`
      const result = await noteService.patchNoteV1(userId, req.body.person, req.body.delete);
      res.json({ Ok: result });
    } catch (err) {
      console.error(err);
      res.json({ Ok: 'Error' }); // Handler kept 200 OK often
    }
  }

  async siteLog(req: Request, res: Response) {
    try {
      // updateSiteLog in handler had hardcoded userId '68988da2b947c4d46023d679'
      // It didn't use req.auth.sub.
      // It reads headers and query.
      const result = await logService.logSiteVisit(req.headers, req.query);
      res.json({ Ok: result });
    } catch (err: any) {
      console.error('Log Error', err);
      res.json({ Ok: err.message || 'fail' });
    }
  }

  // V2 Endpoints

  async getV2Content(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const parentId = req.query.parentId as string;
      const result = await noteService.getNoteV2Content(userId, parentId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.json('No notes');
    }
  }

  async getV2ContentWithChildren(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const parentId = req.query.parentId as string;
      const result = await noteService.getOneLevelDown(userId, parentId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.json('No notes');
    }
  }

  async createV2(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      // handler sent response then synced.
      const doc = await noteService.createNoteV2(userId, req.body);
      res.json(doc);

      try {
        // Async sync
        if (req.body.type === 'FOLDER') {
          // Handler modified req.body for syncCreateV1Note
          const syncBody = { ...req.body };
          syncBody.content = { data: `href:${req.body.id}`, tag: `Sub: ${req.body.name}` };
          noteService.syncCreateV1Note(userId, syncBody);
        } else {
          noteService.syncCreateV1Note(userId, req.body);
        }
      } catch (e) {
        console.error('Sync V1 Error', e);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  }

  async updateV2(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const doc = await noteService.updateNoteV2(userId, req.body.id, req.body);
      res.json(doc);

      try {
        noteService.syncUpdateV1Note(userId, req.body);
      } catch (e) {
        console.error('Sync V1 Error', e);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  }

  async deleteV2(req: Request, res: Response) {
    try {
      const userId = (req as any).auth.sub;
      const result = await noteService.deleteNoteV2(userId, req.body.id, req.body.type);
      res.json(result);

      try {
        noteService.syncDeleteV1Note(userId, req.body.id);
      } catch (e) {
        console.error('Sync V1 Error', e);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  }
}

export const noteController = new NoteController();
