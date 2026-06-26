import redis from "../redisClient.js";

export class ShortTermMemory {
  constructor(sessionId) {
    this.key = `agent:session:${sessionId}`;
    this.ttl = 3600;
  }

  async initSession(ticker, query) {
    await redis.del(this.key);
    await redis.rpush(this.key, JSON.stringify({ type: "init", ticker, query }));
    await redis.expire(this.key, this.ttl);
  }

  async append(entryType, content, extra = {}) {
    await redis.rpush(this.key, JSON.stringify({ type: entryType, content, ...extra }));
  }

  async getLog() {
    const items = await redis.lrange(this.key, 0, -1);
    return items.map(JSON.parse);
  }

  async getObservations() {
    const log = await this.getLog();
    return log.filter(e => e.type === "observation");
  }
}
