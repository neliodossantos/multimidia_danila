export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_editor: boolean
  is_admin: boolean
  avatar_url?: string
  created_at: string
}

export interface Artist {
  id: number
  name: string
  biography?: string
  genre?: string
  country?: string
  formed_year?: number
  image_url?: string
  created_by: number
  created_at: string
  updated_at: string
  albums?: Album[]
  music?: Music[]
}

export interface Album {
  id: number
  title: string
  description?: string
  artist_id: number
  artist_name?: string
  genre?: string
  release_date?: string
  cover_url?: string
  created_by: number
  created_at: string
  updated_at: string
  tracks?: Music[]
}

export interface Music {
  id: number
  title: string
  album_id?: number
  album_title?: string
  artist_id: number
  artist_name?: string
  duration?: number
  track_number?: number
  lyrics?: string
  composer?: string
  file_url?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface Video {
  id: number
  title: string
  description?: string
  artist_id?: number
  artist_name?: string
  duration?: number
  video_url?: string
  thumbnail_url?: string
  genre?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: number
  album_id: number
  album_title?: string
  artist_name?: string
  user_id: number
  username?: string
  first_name?: string
  last_name?: string
  rating: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_1: number
  rating_2: number
  rating_3: number
  rating_4: number
  rating_5: number
}

export interface SharedFile {
  id: number
  owner_id: number
  owner_username?: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type?: string
  music_id?: number
  music_title?: string
  video_id?: number
  video_title?: string
  is_public: boolean
  created_at: string
  shared_at?: string
}

export interface Group {
  id: number
  name: string
  description?: string
  created_by: number
  creator_username?: string
  is_public: boolean
  image_url?: string
  member_count?: number
  user_role?: 'owner' | 'member' | 'none'
  created_at: string
  updated_at?: string
  members?: GroupMember[]
  discussions?: GroupDiscussion[]
}

export interface GroupMember {
  id: number
  username: string
  email: string
  joined_at: string
  role: string
}

export interface GroupDiscussion {
  id: number
  group_id: number
  title: string
  content: string
  created_by: number
  author_username?: string
  replies_count?: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: number
  type: 'editor_promotion' | 'content_update' | 'group_invitation' | 'file_share'
  title: string
  message: string
  is_read: boolean
  data?: any
  created_at: string
}

export interface Playlist {
  id: number
  name: string
  description?: string
  user_id: number
  is_public: boolean
  created_at: string
  updated_at: string
  music?: Music[]
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
  errors?: Array<{ msg: string; param: string }>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}