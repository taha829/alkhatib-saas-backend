import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types/notifications';

export function useNotifications() {
    const queryClient = useQueryClient();

    // Get all notifications
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            return await notificationsApi.getAll();
        },
    });

    // Get unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            return await notificationsApi.getUnreadCount();
        },
    });

    const unreadCount = unreadData?.count || 0;

    // Mark as read
    const markAsRead = useMutation({
        mutationFn: async (id: number) => {
            await notificationsApi.markRead(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    // Mark all as read
    const markAllAsRead = useMutation({
        mutationFn: async () => {
            await notificationsApi.markAllRead();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        },
    });

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}
