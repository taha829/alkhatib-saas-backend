import { z } from 'zod';

export const authSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').optional(),
});

export const appointmentSchema = z.object({
    patient_id: z.number().optional(),
    phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
    name: z.string().min(2, 'الاسم مطلوب'),
    appointment_date: z.string().min(1, 'التاريخ مطلوب'),
    appointment_time: z.string().min(1, 'الوقت مطلوب'),
    notes: z.string().optional(),
});

export const contactSchema = z.object({
    name: z.string().min(2, 'الاسم مطلوب'),
    phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
});
