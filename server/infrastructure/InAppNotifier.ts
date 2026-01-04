import db from '../database.js';
import { NotificationPayload } from '../domain/NotificationEvent.js';

export class InAppNotifier {
    static async send(payload: NotificationPayload): Promise<void> {
        try {
            db.prepare(`
        INSERT INTO notifications (
          user_id, type, title, message, priority, 
          patient_id, appointment_id, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                payload.userId || null,
                payload.event,
                payload.title,
                payload.message,
                payload.priority,
                payload.patientId || null,
                payload.appointmentId || null,
                JSON.stringify(payload.metadata || {}),
                payload.createdAt.toISOString()
            );

            console.log(`[InAppNotifier] ✅ Notification saved: ${payload.title}`);
        } catch (error) {
            console.error('[InAppNotifier] ❌ Error:', error);
            throw error;
        }
    }

    static async getNotifications(userId: number, limit: number = 50): Promise<any[]> {
        try {
            const notifications = db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `).all(userId, limit);

            return notifications;
        } catch (error) {
            console.error('[InAppNotifier] Error fetching notifications:', error);
            return [];
        }
    }

    static async markAsRead(notificationId: number): Promise<void> {
        try {
            db.prepare(`
        UPDATE notifications
        SET is_read = 1, read_at = ?
        WHERE id = ?
      `).run(new Date().toISOString(), notificationId);
        } catch (error) {
            console.error('[InAppNotifier] Error marking as read:', error);
        }
    }

    static async markAllAsRead(userId: number): Promise<void> {
        try {
            db.prepare(`
        UPDATE notifications
        SET is_read = 1, read_at = ?
        WHERE user_id = ? AND is_read = 0
      `).run(new Date().toISOString(), userId);
        } catch (error) {
            console.error('[InAppNotifier] Error marking all as read:', error);
        }
    }

    static async getUnreadCount(userId: number): Promise<number> {
        try {
            const result = db.prepare(`
        SELECT COUNT(*) as count FROM notifications
        WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0
      `).get(userId) as { count: number };

            return result.count;
        } catch (error) {
            console.error('[InAppNotifier] Error getting unread count:', error);
            return 0;
        }
    }
}
