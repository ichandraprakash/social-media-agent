export type CampaignSummary = {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
};

export type UserSummary = {
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
};
