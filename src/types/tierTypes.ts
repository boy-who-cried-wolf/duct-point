
export interface Profile {
  total_points: number;
  [key: string]: any;
}

export interface Tier {
  id: string;
  name: string;
  min_points: number;
  max_points: number | null;
  created_at?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  points_required: number;
  max_value: number;
  tier_id: string;
  created_at?: string;
}

export interface RedeemedPerk {
  id: string;
  user_id: string;
  milestone_id: string;
  redeemed_at: string;
  status: string;
}
