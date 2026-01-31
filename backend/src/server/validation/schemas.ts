import { z } from 'zod';

// ============================================
// Note Schemas
// ============================================

export const CreateV2NoteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  parentId: z.string().min(1, 'Parent ID is required'),
  type: z.enum(['NOTE', 'FOLDER', 'LOG'], {
    errorMap: () => ({ message: 'Type must be NOTE or FOLDER or LOG' }),
  }),
  name: z.string().optional(),
  content: z
    .object({
      data: z.string(),
      date: z.string().optional(),
      tag: z.string().optional(),
    })
    .optional(),
});

export const UpdateV2NoteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  parentId: z.string().optional(),
  name: z.string().optional(),
  content: z
    .object({
      data: z.string(),
      date: z.string().optional(),
      tag: z.string().optional(),
    })
    .optional(),
});

export const DeleteV2NoteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  type: z.enum(['NOTE', 'FOLDER', 'LOG']).optional(),
});

export const NotePersonUpdateSchema = z.object({
  id: z.string().min(1),
  heading: z.string().optional(),
  dataLable: z.object({
    tag: z.string().optional(),
    data: z.string().min(1, 'Data is required'),
    edit: z.string().optional(),
    name: z.string().optional(),
  }),
});

export const UpdateNoteBodySchema = z.object({
  person: NotePersonUpdateSchema,
});

export const UpdateOneNoteBodySchema = z.object({
  person: NotePersonUpdateSchema,
  delete: z.boolean().optional(),
});

// ============================================
// Translation Schemas
// ============================================

export const TranslateTextSchema = z.object({
  sentence: z.string().min(1, 'Sentence is required'),
});

export const VerifyTranslationSchema = z.object({
  english: z.string().min(1, 'English text is required'),
  german: z.string().min(1, 'German text is required'),
});

export const UpdateScoreSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
  attempts: z.number().int().min(1).optional(),
});

export const IncorrectTranslationSchema = z.object({
  exerciseId: z.string().min(1),
  sentence: z.string().min(1),
  userInput: z.string().min(1),
  translation: z.string().min(1),
  corrected: z.boolean().optional(),
});

export const SaveIncorrectTranslationsSchema = z
  .array(IncorrectTranslationSchema)
  .min(1, 'At least one translation is required');

// ============================================
// Query Schemas
// ============================================

export const V2ParentQuerySchema = z.object({
  parentId: z.string().min(1, 'Parent ID is required'),
});

export const SavedTranslationQuerySchema = z.object({
  level: z.string().min(1),
  subLevel: z.string().min(1),
});

export const IncorrectQuerySchema = z.object({
  corrected: z.enum(['true', 'false']).optional(),
});

// Inferred Types
export type CreateV2NoteBody = z.infer<typeof CreateV2NoteSchema>;
export type UpdateV2NoteBody = z.infer<typeof UpdateV2NoteSchema>;
export type DeleteV2NoteBody = z.infer<typeof DeleteV2NoteSchema>;
export type UpdateNoteBody = z.infer<typeof UpdateNoteBodySchema>;
export type UpdateOneNoteBody = z.infer<typeof UpdateOneNoteBodySchema>;

export type TranslateTextBody = z.infer<typeof TranslateTextSchema>;
export type VerifyTranslationBody = z.infer<typeof VerifyTranslationSchema>;
export type UpdateScoreBody = z.infer<typeof UpdateScoreSchema>;
export type SaveIncorrectTranslationsBody = z.infer<typeof SaveIncorrectTranslationsSchema>;

export type V2ParentQuery = z.infer<typeof V2ParentQuerySchema>;
export type SavedTranslationQuery = z.infer<typeof SavedTranslationQuerySchema>;
export type IncorrectQuery = z.infer<typeof IncorrectQuerySchema>;
