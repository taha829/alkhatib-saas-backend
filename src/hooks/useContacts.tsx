import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataApi, apiFetch } from "@/lib/api";
import { toastWithSound } from '@/lib/toast-with-sound';

export interface Contact {
  id: string;
  user_id: string;
  name: string | null;
  phone: string;
  source: string | null;
  platform: string;
  extracted_from: string | null;
  post_id: string | null;
  created_at: string;
}

export const useContacts = () => {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      return await dataApi.getContacts();
    },
  });

  const addContact = useMutation({
    mutationFn: async (contact: any) => {
      return await apiFetch('/contacts', { method: 'POST', body: JSON.stringify(contact) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toastWithSound.success("تمت إضافة جهة الاتصال");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      return await apiFetch(`/contacts/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toastWithSound.success("تم حذف جهة الاتصال");
    },
  });

  const exportContacts = () => {
    if (contacts.length === 0) {
      toastWithSound.error("لا توجد جهات اتصال للتصدير");
      return;
    }

    const csvContent = [
      ["الاسم", "الهاتف", "المصدر", "المنصة", "مستخرج من"],
      ...contacts.map((c: any) => [
        c.name || "",
        c.phone,
        c.source || "",
        c.platform,
        c.extracted_from || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toastWithSound.success("تم تصدير جهات الاتصال بنجاح");
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiFetch(`/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toastWithSound.success("تم تحديث الحالة بنجاح");
    },
  });

  const syncContacts = useMutation({
    mutationFn: async () => {
      return await dataApi.syncContacts();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toastWithSound.success(`تمت مزامنة ${data.synced} مريض جديد بنجاح`);
    },
  });

  return {
    contacts,
    isLoading,
    addContact,
    deleteContact,
    updateStatus,
    exportContacts,
    syncContacts,
  };
};
