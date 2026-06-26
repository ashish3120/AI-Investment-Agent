import crypto from "crypto";
import redis from "../redisClient.js";

export class LoopGuard {
  constructor(sessionId) {
    this.key = `agent:guard:${sessionId}`;
  }

  _hash(action, input) {
    const raw = `${action}:${JSON.stringify(input, Object.keys(input || {}).sort())}`;
    return crypto.createHash("md5").update(raw).digest("hex");
  }

  async record(action, input) {
    await redis.sadd(this.key, this._hash(action, input));
    await redis.expire(this.key, 3600);
  }

  async isDuplicate(action, input) {
    return redis.sismember(this.key, this._hash(action, input));
  }
}
