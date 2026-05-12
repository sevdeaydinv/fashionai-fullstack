export interface CommunityPost {
  id: string;
  user_id: string;
  outfit_id: string | null;
  caption: string | null;
  image_url: string;
  item_images: string[];
  tags: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}
