import { UserTier } from '../enums/user-tier.enum';

export const resolveTierByPoints = (points: number): UserTier => {
  if (points >= 5000) return UserTier.Diamond;
  if (points >= 2500) return UserTier.Platinum;
  if (points >= 1000) return UserTier.Gold;
  if (points >= 500) return UserTier.Silver;
  return UserTier.Bronze;
};

