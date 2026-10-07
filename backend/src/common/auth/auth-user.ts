/** The authenticated caller, taken from the JWT `sub` and `role` claims. */
export interface AuthUser {
  id: string;
  role: "USER" | "SUPERADMIN";
}
