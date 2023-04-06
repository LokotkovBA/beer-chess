import crypto from "crypto";
import { env } from "~/env.mjs";

const resizedIV = Buffer.allocUnsafe(16);
const iv = crypto.createHash("sha256").update(env.SOCKET_SECRET).digest();
iv.copy(resizedIV);

export function encrypt(msg: string) {
    const key = crypto.createHash("sha256").update(env.SOCKET_KEY).digest();
    const cipher = crypto.createCipheriv("aes256", key, resizedIV);

    let encrypted = cipher.update(msg, "utf8", "hex");
    encrypted += cipher.final("hex");

    return encrypted;
}
