export const ACCESS_TOKEN_COOKIE = "access_token";

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure:
    process.env.COOKIE_SECURE === "true" ||
    (process.env.COOKIE_SECURE !== "false" &&
      process.env.NODE_ENV === "production"),
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
