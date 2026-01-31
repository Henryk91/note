import { Request, Response } from 'express';
import { noteService } from '../services/NoteService';
import { websiteTrackingService } from '../services/WebsiteTrackingService';
import { NewV2NoteBody, UpdateV2NoteBody, DeleteV2NoteBody, SiteLogQuery } from '../types/models';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

export class NoteController {
  getNotes = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;

    const { user } = req.query as { user?: string };
    const decodedUser = user ? decodeURI(user) : '';

    if (decodedUser.toLowerCase() === 'all') {
      const result = await noteService.getNotes(userId);
      return res.json(result);
    }
    const { noteHeading } = req.query as { noteHeading?: string };

    if (noteHeading) {
      const result = await noteService.getNote(userId, user ?? '', noteHeading);
      return res.json(result);
    }
    const result = await noteService.getMyNotes(userId, user);
    res.json(result);
  });

  getNoteNames = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await noteService.getNoteNames(userId);
    res.json(result);
  });

  saveNote = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await noteService.createNoteV1(userId, req.body);
    res.json({ Ok: result });
  });

  updateNote = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await noteService.updateNoteV1(userId, req.body.person);
    res.json({ Ok: result });
  });

  updateOneNote = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await noteService.patchNoteV1(userId, req.body.person, req.body.delete);
    res.json({ Ok: result });
  });

  async siteLog(req: Request, res: Response) {
    try {
      const result = await websiteTrackingService.logSiteVisit(req.headers, req.query as SiteLogQuery);
      return res.json({ Ok: result });
    } catch (err: unknown) {
      logger.error({ err }, 'NoteController Error');
      const message = err instanceof Error ? err.message : 'fail';
      return res.json({ Ok: message });
    }
  }

  // V2 Endpoints

  async getV2Content(req: Request, res: Response) {
    try {
      const { userId } = req.auth!;

      const parentId = req.query.parentId as string;
      const result = await noteService.getNoteV2Content(userId, parentId);
      return res.json(result);
    } catch (err) {
      logger.error({ err }, 'NoteController Error');
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getV2ContentWithChildren(req: Request, res: Response) {
    try {
      const { userId } = req.auth!;

      const parentId = req.query.parentId as string;
      const result = await noteService.getOneLevelDown(userId, parentId);
      return res.json(result);
    } catch (err) {
      logger.error({ err }, 'NoteController Error');
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  createV2 = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const doc = await noteService.createNoteV2(userId, req.body as NewV2NoteBody);
    res.json(doc);
  });

  updateV2 = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const doc = await noteService.updateNoteV2(userId, req.body as UpdateV2NoteBody);
    res.json(doc);
  });

  deleteV2 = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.auth!;
    const result = await noteService.deleteNoteV2(userId, req.body as DeleteV2NoteBody);
    res.json(result);
  });
}

export const noteController = new NoteController();
