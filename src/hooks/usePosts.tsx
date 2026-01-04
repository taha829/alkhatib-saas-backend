import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";

export interface Post {
  id: string;
  group_id: string;
  content: string;
  comments_count: number;
  created_at: string;
  group_name?: string;
  platform?: string;
}

export const usePosts = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      return await postsApi.getAll();
    },
  });

  return { posts, isLoading };
};
