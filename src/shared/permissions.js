export function isAdmin(member) {
  if (!member) return false;
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  if (!adminRoleId) return false;
  return member.roles.cache.has(adminRoleId);
}
