import type { EarnTask, EarnTaskCategory } from "./types";

export const EARN_TASK_CAP = 15_000;

export const EARN_TASK_CATEGORIES: EarnTaskCategory[] = [
  { id: "telegram", icon: "📣", title: "Telegram", totalLabel: "+8,000 KICK", tone: "g" },
  { id: "x", icon: "🐦", title: "Twitter / X", totalLabel: "+3,000 KICK", tone: "y" },
  { id: "meta", icon: "📸", title: "Facebook / Instagram", totalLabel: "+2,000 KICK", tone: "b" },
  { id: "youtube", icon: "▶️", title: "YouTube", totalLabel: "+1,000 KICK", tone: "r" },
  { id: "tiktok", icon: "🎬", title: "TikTok", totalLabel: "+1,000 KICK", tone: "y" }
];

export const EARN_TASKS: EarnTask[] = [
  {
    id: "tg-global",
    categoryId: "telegram",
    icon: "🌐",
    name: "Join Global Channel",
    description: "Official WC26 global announcement stream",
    points: 600,
    actionLabel: "JOIN",
    tone: "g"
  },
  {
    id: "tg-nation",
    categoryId: "telegram",
    icon: "💬",
    name: "Join Selected Nation Group",
    description: "Enter your selected nation discussion group",
    points: 500,
    actionLabel: "JOIN",
    tone: "g"
  },
  {
    id: "tg-post",
    categoryId: "telegram",
    icon: "📝",
    name: "Post 5 Meaningful Messages",
    description: "Quality participation required",
    points: 1000,
    actionLabel: "POST",
    tone: "g"
  },
  {
    id: "tg-vote",
    categoryId: "telegram",
    icon: "🗳️",
    name: "Participate in 1 WAR Vote",
    description: "Join one official WAR voting event",
    points: 500,
    actionLabel: "VOTE",
    tone: "g"
  },
  {
    id: "tg-invite3",
    categoryId: "telegram",
    icon: "👥",
    name: "Invite 3 Active Users",
    description: "Each invited user active for at least 3 days",
    points: 1500,
    actionLabel: "INVITE",
    tone: "g"
  },
  {
    id: "tg-invite5",
    categoryId: "telegram",
    icon: "🚀",
    name: "Invite 5 Active Users",
    description: "Each invited user active for at least 3 days",
    points: 1500,
    actionLabel: "INVITE",
    tone: "g"
  },
  {
    id: "x-follow",
    categoryId: "x",
    icon: "👤",
    name: "Follow Official Account",
    description: "Follow the official WC26 X account",
    points: 400,
    actionLabel: "FOLLOW",
    tone: "y"
  },
  {
    id: "x-retweet",
    categoryId: "x",
    icon: "🔁",
    name: "Retweet Official Post",
    description: "Retweet selected official post",
    points: 600,
    actionLabel: "RT",
    tone: "y"
  },
  {
    id: "x-original",
    categoryId: "x",
    icon: "✍️",
    name: "Post Original Tweet #WC26",
    description: "Create original post with hashtag #WC26",
    points: 1200,
    actionLabel: "POST",
    tone: "y"
  },
  {
    id: "meta-follow",
    categoryId: "meta",
    icon: "👤",
    name: "Follow Official Page",
    description: "Follow the official page/profile",
    points: 300,
    actionLabel: "FOLLOW",
    tone: "b"
  },
  {
    id: "meta-share",
    categoryId: "meta",
    icon: "📲",
    name: "Share Official Post",
    description: "Share selected official content",
    points: 500,
    actionLabel: "SHARE",
    tone: "b"
  },
  {
    id: "meta-create",
    categoryId: "meta",
    icon: "🎥",
    name: "Create Original Content about WC26",
    description: "Original post/reel/story about WC26",
    points: 800,
    actionLabel: "CREATE",
    tone: "b"
  },
  {
    id: "yt-subscribe",
    categoryId: "youtube",
    icon: "📺",
    name: "Subscribe Official Channel",
    description: "Subscribe to WC26 YouTube channel",
    points: 300,
    actionLabel: "SUBSCRIBE",
    tone: "r"
  },
  {
    id: "yt-watch",
    categoryId: "youtube",
    icon: "⏱️",
    name: "Watch Minimum 2 Minutes",
    description: "Watch-time verified by platform signal",
    points: 300,
    actionLabel: "WATCH",
    tone: "r"
  },
  {
    id: "yt-comment",
    categoryId: "youtube",
    icon: "🗨️",
    name: "Comment on Latest Video",
    description: "Meaningful comment on latest upload",
    points: 400,
    actionLabel: "COMMENT",
    tone: "r"
  },
  {
    id: "tt-follow",
    categoryId: "tiktok",
    icon: "👤",
    name: "Follow Official Account",
    description: "Follow WC26 official TikTok",
    points: 300,
    actionLabel: "FOLLOW",
    tone: "y"
  },
  {
    id: "tt-share",
    categoryId: "tiktok",
    icon: "📤",
    name: "Share Video",
    description: "Share official WC26 TikTok video",
    points: 300,
    actionLabel: "SHARE",
    tone: "y"
  },
  {
    id: "tt-create",
    categoryId: "tiktok",
    icon: "🎥",
    name: "Create Original WC26 Content",
    description: "Upload original WC26-themed content",
    points: 400,
    actionLabel: "CREATE",
    tone: "y"
  }
];
