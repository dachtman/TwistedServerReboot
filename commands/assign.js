const { SlashCommandBuilder } = require('@discordjs/builders');
const { sendInteractionSelectMenuReply } = require('../scripts/message');
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


const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description)
	.addUserOption(option => option.setName(optionsArr[0].name).setDescription(optionsArr[0].description).setRequired(true))
	.addStringOption(option => option.setName(optionsArr[1].name).setDescription(optionsArr[1].description).setRequired(true).addChoices(optionsArr[1].choices));

function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, options, guild:{ roles } } = interaction;
		const user = options.getMember(optionsArr[0].name);
		const assignedRole = options.getString(optionsArr[1].name) || PLEEB;
		getMyContainers(author, ADMIN)
			.then((containers) => {
				sendInteractionSelectMenuReply(interaction, containers)
					.then(({ values }) => {
						values.forEach((value) => {
							addUser(user, value, roles, assignedRole);
						});
						resolve(`Added ${assignedRole} to ${user.displayName} for ${values.join(',')}`);
					})
					.catch(reject);
			})
			.catch(reject);
	});
}
module.exports = {
	data,
	execute
};