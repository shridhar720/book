export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  category_id: number;
  category_name: string;
  status: 'available' | 'loaned';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Review {
  id: number;
  book_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
}
