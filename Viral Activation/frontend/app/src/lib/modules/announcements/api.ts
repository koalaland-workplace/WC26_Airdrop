import { httpGet } from "../../api/http";
import type { AppLatestAnnouncementResponse } from "./types";

const APP_LATEST_ANNOUNCEMENT_ENDPOINT = "/api/v1/app/announcements/latest";

export async function fetchLatestAnnouncement(): Promise<AppLatestAnnouncementResponse> {
  return httpGet<AppLatestAnnouncementResponse>(APP_LATEST_ANNOUNCEMENT_ENDPOINT);
}
