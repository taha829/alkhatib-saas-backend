import { Request, Response } from 'express';
import { InAppNotifier } from '../infrastructure/InAppNotifier.js';

// Get user notifications
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const limit = parseInt(req.query.limit as string) || 50;

        const notifications = await InAppNotifier.getNotifications(userId, limit);
        res.json(notifications);
    } catch (error) {
        console.error('[NotificationController] Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const count = await InAppNotifier.getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        console.error('[NotificationController] Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};

// Mark as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await InAppNotifier.markAsRead(parseInt(id));
        res.json({ success: true });
    } catch (error) {
        console.error('[NotificationController] Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

// Mark all as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        await InAppNotifier.markAllAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('[NotificationController] Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};
