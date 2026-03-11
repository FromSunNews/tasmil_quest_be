import { UserRole } from '../../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  walletAddress: string;
  username: string;
  role: UserRole;
  tokenId?: string;
}

