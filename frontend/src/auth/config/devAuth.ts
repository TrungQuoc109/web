export const defaultCredentials = {
  email: "duongtrungquoc@gmail.com",
  password: "12345678",
} as const;

export const autoLoginEnabled =
  import.meta.env.VITE_AUTO_LOGIN === "1" ||
  import.meta.env.VITE_AUTO_LOGIN === "true";

