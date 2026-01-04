import { useState } from "react";
import { toastWithSound } from '@/lib/toast-with-sound';
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { dataApi, apiFetch } from "@/lib/api";

export interface ExtractionResult {
  success: boolean;
  message: string;
  data: any[];
  count: number;
}

export const useDataExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const extractFromUrl = async (url: string, platform: string = 'unknown', type: string = 'post'): Promise<ExtractionResult | null> => {
    if (!user) {
      toastWithSound.error("يجب تسجيل الدخول أولاً");
      return null;
    }

    setIsExtracting(true);
    try {
      const response = await dataApi.scrape({ url, platform, type });

      toastWithSound.success(`تم استخراج ${response.count} رقم بنجاح`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });

      return {
        success: true,
        message: "تم الاستخراج والحفظ بنجاح",
        data: response.phones,
        count: response.count
      };
    } catch (error: any) {
      toastWithSound.error(error.message || "فشل الاستخراج (تأكد من فعالية الاشتراك)");
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const extractFromText = async (text: string, platform: string = 'unknown'): Promise<ExtractionResult | null> => {
    if (!user) {
      toastWithSound.error("يرجى إدخال أرقام صحيحة");
      return null;
    }

    setIsExtracting(true);
    try {
      const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(01[0125]|05\d|09\d)[-. )]*(\d{7,8})/g;
      const phones = [...new Set(text.match(phoneRegex) || [])];

      if (phones.length > 0) {
        // Save manually via API for text paste
        for (const phone of phones) {
          await apiFetch('/contacts', {
            method: 'POST',
            body: JSON.stringify({ phone, platform, source: 'Text Paste' })
          });
        }
        toastWithSound.success(`تم حفظ ${phones.length} رقم بنجاح`);
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      }

      return { success: true, message: "تم الحفظ", data: phones, count: phones.length };
    } catch (error: any) {
      toastWithSound.error("حدث خطأ أثناء الحفظ");
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractFromUrl, extractFromText, isExtracting };
};
