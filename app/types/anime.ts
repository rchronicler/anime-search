export interface AnimeImage {
  jpg: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
}

export interface AnimeItem {
  mal_id: number;
  title: string;
  year: number | null;
  score: number;
  images: AnimeImage;
}