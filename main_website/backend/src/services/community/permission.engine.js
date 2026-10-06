/**
 * Scalable Permission Engine for Community Role-Based Access Control.
 * Maps roles (OWNER, ADMIN, MEMBER, MODERATOR) to granular action permissions.
 * Future roles (e.g. MODERATOR, AUDITOR) can be added without modifying business logic.
 */

const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  MEMBER: 'MEMBER'
};

const ACTIONS = {
  COMMUNITY_UPDATE: 'COMMUNITY_UPDATE',
  COMMUNITY_DELETE: 'COMMUNITY_DELETE',
  MEMBER_MANAGE: 'MEMBER_MANAGE',
  MEMBER_REMOVE: 'MEMBER_REMOVE',
  INVITE_CREATE: 'INVITE_CREATE',
  POST_CREATE: 'POST_CREATE',
  POST_DELETE_ANY: 'POST_DELETE_ANY',
  POST_EDIT_ANY: 'POST_EDIT_ANY',
  COMMENT_CREATE: 'COMMENT_CREATE',
  COMMENT_DELETE_ANY: 'COMMENT_DELETE_ANY'
};

const PERMISSION_MATRIX = {
  [ACTIONS.COMMUNITY_UPDATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.COMMUNITY_DELETE]: [ROLES.OWNER],
  [ACTIONS.MEMBER_MANAGE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.MEMBER_REMOVE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.INVITE_CREATE]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.POST_CREATE]: [ROLES.OWNER, ROLES.ADMIN, ROLES.MODERATOR, ROLES.MEMBER],
  [ACTIONS.POST_DELETE_ANY]: [ROLES.OWNER, ROLES.ADMIN, ROLES.MODERATOR],
  [ACTIONS.POST_EDIT_ANY]: [ROLES.OWNER, ROLES.ADMIN],
  [ACTIONS.COMMENT_CREATE]: [ROLES.OWNER, ROLES.ADMIN, ROLES.MODERATOR, ROLES.MEMBER],
  [ACTIONS.COMMENT_DELETE_ANY]: [ROLES.OWNER, ROLES.ADMIN, ROLES.MODERATOR]
};

/**
  Checks if a given role has permission to perform an action.
 * @param {string} role - The member's role
 * @param {string} action - The action requested
 * @returns {boolean}
 */
function hasPermission(role, action) {
  if (!role || !action) return false;
  const allowedRoles = PERMISSION_MATRIX[action] || [];
  return allowedRoles.includes(role);
}

module.exports = {
  ROLES,
  ACTIONS,
  hasPermission
};
