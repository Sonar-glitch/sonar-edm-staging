export const sessionOptions = {
  cookieName: "tiko-session",
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
};
