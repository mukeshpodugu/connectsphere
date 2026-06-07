import { createClient } from 'redis';
import User from '../models/User';

type RedisClientType = ReturnType<typeof createClient>;

class PresenceService {
  private redisClient: RedisClientType | null = null;
  private memoryStore = new Map<string, { status: string; socketId: string; lastSeen: Date }>();
  private useRedis = false;

  constructor() {
    this.init();
  }

  private async init() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[PresenceService] No REDIS_URL provided. Operating in Memory mode.');
      return;
    }

    try {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', (err) => {
        console.warn('[PresenceService] Redis Error, falling back to Memory mode:', err.message);
        this.useRedis = false;
      });

      await this.redisClient.connect();
      console.log('[PresenceService] Connected to Redis successfully.');
      this.useRedis = true;
    } catch (error: any) {
      console.warn('[PresenceService] Redis connection failed, using Memory fallback:', error.message);
      this.useRedis = false;
    }
  }

  // Set user online
  public async setUserOnline(userId: string, socketId: string, status: 'online' | 'away' | 'busy' = 'online') {
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.hSet(`presence:${userId}`, {
          status,
          socketId,
          lastSeen: new Date().toISOString()
        });
        await this.redisClient.sAdd('online_users', userId);
      } catch (err) {
        this.fallbackOnline(userId, socketId, status);
      }
    } else {
      this.fallbackOnline(userId, socketId, status);
    }

    // Update status in Database
    try {
      await User.findByIdAndUpdate(userId, { status, lastSeen: new Date() });
    } catch (dbErr) {
      console.error('[PresenceService] DB presence update failed:', dbErr);
    }
  }

  private fallbackOnline(userId: string, socketId: string, status: string) {
    this.memoryStore.set(userId, {
      status,
      socketId,
      lastSeen: new Date()
    });
  }

  // Set user offline
  public async setUserOffline(userId: string) {
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.hSet(`presence:${userId}`, {
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
        await this.redisClient.sRem('online_users', userId);
      } catch (err) {
        this.fallbackOffline(userId);
      }
    } else {
      this.fallbackOffline(userId);
    }

    // Update in DB
    try {
      await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
    } catch (dbErr) {
      console.error('[PresenceService] DB presence update failed:', dbErr);
    }
  }

  private fallbackOffline(userId: string) {
    const existing = this.memoryStore.get(userId);
    if (existing) {
      this.memoryStore.set(userId, {
        status: 'offline',
        socketId: '',
        lastSeen: new Date()
      });
    }
  }

  // Get online status of a user
  public async getUserStatus(userId: string): Promise<{ status: string; lastSeen: Date }> {
    if (this.useRedis && this.redisClient) {
      try {
        const presence = await this.redisClient.hGetAll(`presence:${userId}`);
        if (presence && presence.status) {
          return {
            status: presence.status,
            lastSeen: new Date(presence.lastSeen)
          };
        }
      } catch (err) {
        return this.fallbackGetStatus(userId);
      }
    }
    return this.fallbackGetStatus(userId);
  }

  private fallbackGetStatus(userId: string) {
    const val = this.memoryStore.get(userId);
    if (val) {
      return { status: val.status, lastSeen: val.lastSeen };
    }
    return { status: 'offline', lastSeen: new Date() };
  }

  // Get list of all online user IDs
  public async getOnlineUsers(): Promise<string[]> {
    if (this.useRedis && this.redisClient) {
      try {
        return await this.redisClient.sMembers('online_users');
      } catch (err) {
        return this.fallbackGetOnlineUsers();
      }
    }
    return this.fallbackGetOnlineUsers();
  }

  private fallbackGetOnlineUsers(): string[] {
    const online: string[] = [];
    for (const [userId, val] of this.memoryStore.entries()) {
      if (val.status !== 'offline' && val.status !== '') {
        online.push(userId);
      }
    }
    return online;
  }
}

export default new PresenceService();
