export interface Profile {
  id: string
  username: string
  full_name: string
  bio: string | null
  gender: string | null
  avatar_url: string | null
  cover_url: string | null
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface PostMedia { id: string; post_id: string; url: string; position: number }

export interface Post {
  id: string
  author_id: string
  content: string | null
  created_at: string
  updated_at: string
  author?: Profile
  media?: PostMedia[]
  like_count?: number
  comment_count?: number
  liked_by_me?: boolean
  bookmarked_by_me?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  author?: Profile
}

export interface Story {
  id: string
  author_id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  created_at: string
  expires_at: string
  author?: Profile
}

export interface Conversation {
  id: string
  created_at: string
  last_message_at: string
  members?: Profile[]
  last_message?: Message | null
  unread?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  image_url: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  actor_id: string | null
  type: 'follow' | 'follow_request' | 'like' | 'comment' | 'message' | 'story_view' | 'mention'
  post_id: string | null
  conversation_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
}

export interface Preferences {
  user_id: string
  theme: string
  notif_in_app: boolean
  message_perm: 'everyone' | 'followers' | 'no_one'
  story_visibility: 'followers' | 'everyone' | 'close'
}

export type ThemeName =
  | 'midnight' | 'aurora' | 'ocean' | 'rose'
  | 'emerald' | 'lavender' | 'sunset' | 'minimal'
