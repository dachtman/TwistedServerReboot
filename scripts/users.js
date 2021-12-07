const { Permissions:{ FLAGS:{ ADMINISTRATOR, MANAGE_ROLES } } } = require('discord.js');
const ROLES = {
	ADMIN: 'admin',
	PLEEB: 'pleeb',
};
const EMOJI_REACTIONS = {
	THUMBS_UP : '👍',
	THUMBS_DOWN : '👎',
};
function getRoleName(containerName, role = ROLES.PLEEB) {
	return `${containerName.toLowerCase()}-${role.toLowerCase()}`;
}

function isAdmin(user) {
	return user.permissions.has(ADMINISTRATOR);
}

function canUserDoThis(user, containerName, ignoreSuperAdmins = false, roleRequired = ROLES.ADMIN) {
	if (isAdmin(user) && !ignoreSuperAdmins) {
		return true;
	}
	return user.roles.cache.some(r => r.name === getRoleName(containerName, roleRequired));
}

function canUserAccessContainer(containerName, { id }, { message: { guild: { roles: { cache } } } }) {
	return cache
		.filter(role => role.name.startsWith(containerName))
		.some(role => role.members.get(id));
}

function addUser(user, containerName, roles, assignedRole = ROLES.PLEEB) {
	if (assignedRole === ROLES.ADMIN) {
		removeUser(user, containerName, roles);
	}
	const roleName = getRoleName(containerName, assignedRole);
	const { cache } = roles;
	const roleExist = cache.find(r => r.name === roleName);
	if (!roleExist) {
		const permissions = assignedRole === ROLES.PLEEB ? [] : [MANAGE_ROLES];
		roles.create({ name: roleName, permissions })
			.then(newRole => user.roles.add(newRole));
		return;
	}
	user.roles.add(roleExist);
	return;
}

// TODO
// Double check that admin is not removing admin
function removeUser(user, containerName, { cache }) {
	[getRoleName(containerName, ROLES.ADMIN), getRoleName(containerName, ROLES.PLEEB)].forEach((roleName) => {
		const roleExist = cache.find(r => r.name === roleName);
		if (roleExist && user.roles.cache.some(r => r.name === roleName)) {
			user.roles.remove(roleExist);
		}
	});
	return true;
}

/*

const filter = (r) => {
	return r.emoji.name === EMOJI_REACTIONS.THUMBS_UP || r.emoji.name === EMOJI_REACTIONS.THUMBS_DOWN;
};

function getContainerMembers(containerName) {
}

function getUsersByContainer({ id:authorID }, containerName) {
}
*/

module.exports = {
	EMOJI_REACTIONS,
	ROLES,
	canUserDoThis,
	addUser,
	removeUser,
	isAdmin,
	getRoleName,
	canUserAccessContainer
};