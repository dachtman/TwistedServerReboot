const { SlashCommandBuilder } = require('@discordjs/builders');
const { getMyContainers } = require('../scripts/docker');
const { ROLES: { ADMIN, PLEEB }, addUser } = require('../scripts/users');
const name = 'assign';
const description = 'Assigns user(s) to a docker container with the applicable role';
const optionsArr = [{
	'name' : 'user',
	'description' : 'A user',
}, {
	'name' : 'role',
	'description' : 'A role',
	'choices' : [['Pleeb', PLEEB], ['Admin', ADMIN]]
}];