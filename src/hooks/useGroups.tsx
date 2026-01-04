import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/lib/api";
import { toastWithSound } from '@/lib/toast-with-sound';

export interface Group {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  status: string;
  members_count: number;
  created_at: string;
}

export const useGroups = () => {
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      return await groupsApi.getAll();
    },
  });

  const addGroup = useMutation({
    mutationFn: async (group: any) => {
      return await groupsApi.create(group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toastWithSound.success("تمت إضافة المجموعة");
    },
  });

  const updateGroupStatus = useMutation({
    mutationFn: async ({ id, status }: any) => {
      return await groupsApi.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      return await groupsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toastWithSound.success("تم حذف المجموعة");
    },
  });

  return {
    groups,
    isLoading,
    addGroup,
    updateGroupStatus,
    deleteGroup,
  };
};
