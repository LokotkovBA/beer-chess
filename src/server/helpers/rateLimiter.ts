import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Unit = "ms" | "s" | "m" | "h" | "d";
type Duration = `${number} ${Unit}` | `${number}${Unit}`;

export function createRatelimiter(limit: number, interval: Duration) {
    return new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, interval),
        analytics: true
    });
}