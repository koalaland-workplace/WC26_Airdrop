export interface AppAnnouncementItem {
  id: string;
  title: string;
  message: string;
  target: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface AppLatestAnnouncementResponse {
  item: AppAnnouncementItem | null;
}
