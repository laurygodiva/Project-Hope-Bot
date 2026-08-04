export function isAdmin(member) {
  if (!member) return false;
  const adminRoleId = process.env.ADMIN_ROLE_ID;
  if (!adminRoleId) return false;
  return member.roles.cache.has(adminRoleId);
}

export function isSanctionsManager(member) {
  if (!member) return false;
  const roleId = process.env.SANCTIONS_MANAGER_ROLE_ID;
  if (!roleId) return false;
  return member.roles.cache.has(roleId);
}

export function isFounder(member) {
  if (!member) return false;
  const roleId = process.env.FOUNDER_ROLE_ID;
  if (!roleId) return false;
  return member.roles.cache.has(roleId);
}
