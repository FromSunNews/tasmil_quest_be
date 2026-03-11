import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Task } from '../tasks/entities/task.entity';
import { UserTask } from '../user-tasks/entities/user-task.entity';
import { SocialAccount } from '../social-accounts/entities/social-account.entity';
import { User } from '../users/entities/user.entity';
import { TaskType } from '../../common/enums/task-type.enum';
import { UserTaskStatus } from '../../common/enums/user-task-status.enum';
import { BusinessException } from '../../common/exceptions/business.exception';
import { UsersService } from '../users/users.service';

export interface VerifyResult {
  success: boolean;
  message: string;
}

@Injectable()
export class SocialVerificationService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(UserTask)
    private readonly userTaskRepository: Repository<UserTask>,
    @InjectRepository(SocialAccount)
    private readonly socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Main verification method - verifies a task for a user
   */
  async verifyTask(userId: string, taskId: string): Promise<VerifyResult> {
    // Get task
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new BusinessException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found',
        status: 404,
      });
    }

    // Check if task has checkId configured
    if (!task.checkId && task.taskType !== TaskType.Visit) {
      throw new BusinessException({
        code: 'TASK_NOT_CONFIGURED',
        message: 'Task verification is not configured',
        status: 400,
      });
    }

    // Get or create user task
    let userTask = await this.userTaskRepository.findOne({
      where: { userId, taskId },
    });

    if (!userTask) {
      userTask = this.userTaskRepository.create({
        userId,
        campaignId: task.campaignId,
        taskId,
        status: UserTaskStatus.Pending,
      });
    }

    // Check if already completed
    if (userTask.status === UserTaskStatus.Approved) {
      return {
        success: true,
        message: 'Task already completed',
      };
    }

    // Verify based on task type
    let verified = false;
    let errorMessage = 'Verification failed';

    try {
      switch (task.taskType) {
        case TaskType.Discord: {
          const discordResult = await this.verifyDiscord(userId, task.checkId!);
          verified = discordResult.success;
          errorMessage = discordResult.message;
          break;
        }

        case TaskType.Telegram: {
          const telegramResult = await this.verifyTelegram(userId, task.checkId!);
          verified = telegramResult.success;
          errorMessage = telegramResult.message;
          break;
        }

        case TaskType.X_Follow: {
          const followResult = await this.verifyXFollow(userId, task.checkId!);
          verified = followResult.success;
          errorMessage = followResult.message;
          break;
        }

        case TaskType.X_Retweet: {
          const retweetResult = await this.verifyXRetweet(userId, task.checkId!);
          verified = retweetResult.success;
          errorMessage = retweetResult.message;
          break;
        }

        case TaskType.X_Comment: {
          const commentResult = await this.verifyXComment(userId, task.checkId!);
          verified = commentResult.success;
          errorMessage = commentResult.message;
          break;
        }

        case TaskType.X_Like:
          // X_Like not yet implemented - will need additional API
          return {
            success: false,
            message: 'X Like verification not yet available',
          };

        case TaskType.Visit:
          // Visit tasks require proof data (recorded via /visit endpoint)
          if (!userTask.proofData) {
            verified = false;
            errorMessage = 'Please visit the website first. Click "Visit Link" and stay on the page for at least 30 seconds.';
          } else {
            try {
              const proof = JSON.parse(userTask.proofData);
              // Verify that proof exists and has visit type
              if (proof.type === 'visit' && proof.visitedAt) {
                verified = true;
                errorMessage = '';
              } else {
                verified = false;
                errorMessage = 'Invalid visit proof. Please visit the website again.';
              }
            } catch {
              verified = false;
              errorMessage = 'Invalid visit proof format. Please visit the website again.';
            }
          }
          break;

        case TaskType.Onchain: {
          const onchainResult = await this.verifyOnchain(userId, task.checkId!);
          verified = onchainResult.success;
          errorMessage = onchainResult.message;
          break;
        }

        default:
          return {
            success: false,
            message: 'Unknown task type',
          };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return {
        success: false,
        message: 'Verification failed due to an error',
      };
    }

    if (verified) {
      // Update user task status to Approved
      userTask.status = UserTaskStatus.Approved;
      userTask.completedAt = new Date();
      userTask.pointsEarned = task.rewardPoints;
      await this.userTaskRepository.save(userTask);

      // Handle referral reward
      await this.usersService.handleReferralReward(userId, userTask.id);

      return {
        success: true,
        message: 'Task verified successfully',
      };
    }

    return {
      success: false,
      message: errorMessage,
    };
  }

  /**
   * Verify Discord guild membership
   */
  private async verifyDiscord(
    userId: string,
    guildId: string,
  ): Promise<VerifyResult> {
    // Get user's Discord account
    const discordAccount = await this.socialAccountRepository.findOne({
      where: { userId, platform: 'Discord' },
    });

    if (!discordAccount) {
      return {
        success: false,
        message: 'Please connect your Discord account first',
      };
    }

    const botToken = this.configService.get<string>('DISCORD_BOT_TOKEN');
    if (!botToken) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return {
        success: false,
        message: 'Discord verification not available',
      };
    }

    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordAccount.platformUserId}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
        },
      );

      if (response.ok) {
        return {
          success: true,
          message: 'Discord membership verified',
        };
      }

      return {
        success: false,
        message: 'You have not joined the Discord server',
      };
    } catch (error) {
      console.error('Discord verification error:', error);
      return {
        success: false,
        message: 'Failed to verify Discord membership',
      };
    }
  }

  /**
   * Verify Telegram channel membership
   */
  private async verifyTelegram(
    userId: string,
    channelId: string,
  ): Promise<VerifyResult> {
    // Get user's Telegram account
    const telegramAccount = await this.socialAccountRepository.findOne({
      where: { userId, platform: 'Telegram' },
    });

    if (!telegramAccount) {
      return {
        success: false,
        message: 'Please connect your Telegram account first',
      };
    }

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return {
        success: false,
        message: 'Telegram verification not available',
      };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChatMember`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channelId,
            user_id: parseInt(telegramAccount.platformUserId),
          }),
        },
      );

      if (!response.ok) {
        return {
          success: false,
          message: 'You have not joined the Telegram channel',
        };
      }

      const data = await response.json();
      const status = data.result?.status;

      const validStatuses = ['creator', 'administrator', 'member', 'restricted'];
      if (validStatuses.includes(status)) {
        return {
          success: true,
          message: 'Telegram membership verified',
        };
      }

      return {
        success: false,
        message: 'You have not joined the Telegram channel',
      };
    } catch (error) {
      console.error('Telegram verification error:', error);
      return {
        success: false,
        message: 'Failed to verify Telegram membership',
      };
    }
  }

  /**
   * Verify X (Twitter) follow
   */
  private async verifyXFollow(
    userId: string,
    targetUsername: string,
  ): Promise<VerifyResult> {
    // Get user's X account
    const xAccount = await this.socialAccountRepository.findOne({
      where: { userId, platform: 'X' },
    });

    if (!xAccount || !xAccount.username) {
      return {
        success: false,
        message: 'Please connect your X account first',
      };
    }

    const apiKey = this.configService.get<string>('X_API_KEY');
    if (!apiKey) {
      console.error('X_API_KEY not configured');
      return {
        success: false,
        message: 'X verification not available',
      };
    }

    try {
      const response = await fetch(
        `https://api.twitterapi.io/twitter/user/check_follow_relationship?source_user_name=${xAccount.username}&target_user_name=${targetUsername}`,
        {
          headers: { 'X-API-Key': apiKey },
        },
      );

      if (!response.ok) {
        return {
          success: false,
          message: 'Failed to check follow status',
        };
      }

      const data = await response.json();
      if (data?.data?.following === true) {
        return {
          success: true,
          message: 'Follow verified',
        };
      }

      return {
        success: false,
        message: `You are not following @${targetUsername}`,
      };
    } catch (error) {
      console.error('X follow verification error:', error);
      return {
        success: false,
        message: 'Failed to verify follow status',
      };
    }
  }

  /**
   * Verify X (Twitter) retweet
   */
  private async verifyXRetweet(
    userId: string,
    tweetId: string,
  ): Promise<VerifyResult> {
    // Get user's X account
    const xAccount = await this.socialAccountRepository.findOne({
      where: { userId, platform: 'X' },
    });

    if (!xAccount || !xAccount.username) {
      return {
        success: false,
        message: 'Please connect your X account first',
      };
    }

    const apiKey = this.configService.get<string>('X_API_KEY');
    if (!apiKey) {
      console.error('X_API_KEY not configured');
      return {
        success: false,
        message: 'X verification not available',
      };
    }

    try {
      const response = await fetch(
        `https://api.twitterapi.io/twitter/user/last_tweets?userName=${xAccount.username}`,
        {
          headers: { 'X-API-Key': apiKey },
        },
      );

      if (!response.ok) {
        return {
          success: false,
          message: 'Failed to check retweet status',
        };
      }

      const data = await response.json();
      const tweets = data?.data?.tweets || [];

      const hasRetweeted = tweets.some((tweet: any) => {
        const retweetId =
          tweet?.retweeted_tweet?.id || tweet?.quoted_tweet?.id;
        return (
          retweetId?.toString().toLowerCase() === tweetId.toLowerCase()
        );
      });

      if (hasRetweeted) {
        return {
          success: true,
          message: 'Retweet verified',
        };
      }

      return {
        success: false,
        message: 'You have not retweeted this post',
      };
    } catch (error) {
      console.error('X retweet verification error:', error);
      return {
        success: false,
        message: 'Failed to verify retweet status',
      };
    }
  }

  /**
   * Verify X (Twitter) comment
   */
  private async verifyXComment(
    userId: string,
    tweetId: string,
  ): Promise<VerifyResult> {
    // Get user's X account
    const xAccount = await this.socialAccountRepository.findOne({
      where: { userId, platform: 'X' },
    });

    if (!xAccount || !xAccount.username) {
      return {
        success: false,
        message: 'Please connect your X account first',
      };
    }

    const apiKey = this.configService.get<string>('X_API_KEY');
    if (!apiKey) {
      console.error('X_API_KEY not configured');
      return {
        success: false,
        message: 'X verification not available',
      };
    }

    try {
      const response = await fetch(
        `https://api.twitterapi.io/twitter/tweet/replies?tweetId=${tweetId}`,
        {
          headers: { 'X-API-Key': apiKey },
        },
      );

      if (!response.ok) {
        return {
          success: false,
          message: 'Failed to check comment status',
        };
      }

      const data = await response.json();
      const replies = data?.tweets || [];

      const hasCommented = replies.some(
        (reply: any) =>
          reply.author?.userName?.toLowerCase() ===
          xAccount.username?.toLowerCase(),
      );

      if (hasCommented) {
        return {
          success: true,
          message: 'Comment verified',
        };
      }

      return {
        success: false,
        message: 'You have not commented on this post',
      };
    } catch (error) {
      console.error('X comment verification error:', error);
      return {
        success: false,
        message: 'Failed to verify comment status',
      };
    }
  }

  /**
   * Verify onchain interaction with a smart contract
   */
  private async verifyOnchain(
    userId: string,
    contractAddress: string,
  ): Promise<VerifyResult> {
    // Get user's wallet address
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.walletAddress) {
      return {
        success: false,
        message: 'Please connect your wallet first',
      };
    }

    const rpcUrl = this.configService.get<string>('RPC_URL');
    if (!rpcUrl) {
      console.error('RPC_URL not configured');
      return {
        success: false,
        message: 'Onchain verification not available',
      };
    }

    try {
      // Query transaction history for the user's wallet interacting with the contract
      // This is a simplified check - in production you might use an indexer or explorer API
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [
            {
              address: contractAddress,
              topics: [
                null, // Any event
                '0x000000000000000000000000' +
                  user.walletAddress.slice(2).toLowerCase(), // From address in topic
              ],
              fromBlock: 'earliest',
              toBlock: 'latest',
            },
          ],
        }),
      });

      const data = await response.json();
      const logs = data?.result || [];

      if (logs.length > 0) {
        return {
          success: true,
          message: 'Onchain interaction verified',
        };
      }

      // Also check if user was the 'to' in topics
      const response2 = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_getLogs',
          params: [
            {
              address: contractAddress,
              topics: [
                null,
                null,
                '0x000000000000000000000000' +
                  user.walletAddress.slice(2).toLowerCase(),
              ],
              fromBlock: 'earliest',
              toBlock: 'latest',
            },
          ],
        }),
      });

      const data2 = await response2.json();
      const logs2 = data2?.result || [];

      if (logs2.length > 0) {
        return {
          success: true,
          message: 'Onchain interaction verified',
        };
      }

      return {
        success: false,
        message: 'No interaction found with this contract',
      };
    } catch (error) {
      console.error('Onchain verification error:', error);
      return {
        success: false,
        message: 'Failed to verify onchain interaction',
      };
    }
  }
}
