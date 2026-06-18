export function isBlockedPasswordMarker(passwordHash: string | null | undefined) {
  return Boolean(passwordHash?.startsWith("__SUSPENDED__") || passwordHash?.startsWith("__REINSTATED__"));
}
