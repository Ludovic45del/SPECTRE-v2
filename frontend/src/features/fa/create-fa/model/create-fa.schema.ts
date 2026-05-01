/**
 * Create FA Form Schema
 * @module features/fa/create-fa/model
 *
 * UI-specific schema using Dayjs for date fields (not reusable as API schema)
 */

import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';

export const CreateFaFormSchema = z.object({
    campaignId: z.string().uuid('La campagne est requise'),
    fsecVersionId: z.string().uuid('La FSEC est requise'),
    discovererUserUuid: z.string().uuid('Le découvreur est requis'),
    eventDate: z.custom<Dayjs>((val) => dayjs.isDayjs(val), { message: 'La date est requise' }),
    observation: z.string().min(1, 'Le constat est requis'),
    locationEquipment: z.string().nullable().optional(),
    quickAnalysis: z.string().min(1, "L'analyse rapide est requise"),
    immediateMeasures: z.string().nullable().optional(),
});

export type CreateFaForm = z.infer<typeof CreateFaFormSchema>;
