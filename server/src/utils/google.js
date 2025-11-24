import axios from "axios";
import { env } from "../config/env.js";

export async function exchangeGoogleCodeForTokens(code) {
  const { data } = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id: env.googleId,
    client_secret: env.googleSecret,
    redirect_uri: `${env.serverURI}/auth/google/callback`,
    grant_type: "authorization_code",
  });

  return data;
}

export function decodeGoogleIdToken(id_token) {
  const payload = JSON.parse(
    Buffer.from(id_token.split(".")[1], "base64").toString()
  );

  return payload;
}
