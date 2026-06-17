type AdminIdentity = {
  id?: string | null;
  email?: string | null;
};

function parseEnvList(value: string | undefined) {
  return (value ?? "")
    .split(/[,\r\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdmin(identity: AdminIdentity) {
  const adminEmails = parseEnvList(process.env.ADMIN_EMAILS);
  const adminUserIds = parseEnvList(process.env.ADMIN_USER_IDS);
  const email = identity.email?.trim().toLowerCase();
  const userId = identity.id?.trim().toLowerCase();

  return Boolean(
    (email && adminEmails.includes(email)) ||
    (userId && adminUserIds.includes(userId))
  );
}

export function resolveRole(
  role: "user" | "creator" | "admin" | null | undefined,
  identity: AdminIdentity
) {
  if (role === "admin" || isBootstrapAdmin(identity)) return "admin";
  return role ?? "user";
}
