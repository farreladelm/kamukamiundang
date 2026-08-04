import "server-only";

export {
  hashAdminPassword,
  normalizeAdminEmail,
  verifyAdminPassword,
} from "./password-core";

export const ADMIN_LOGIN_ERROR = "Email atau kata sandi salah.";
