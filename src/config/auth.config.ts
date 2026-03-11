import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
  jwtAccessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
  jwtRefreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '604800', 10),
  referralRewardPoints: parseInt(
    process.env.REFERRAL_REWARD_POINTS ?? '100',
    10,
  ),
}));

