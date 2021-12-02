const { SlashCommandBuilder } = require('@discordjs/builders');
const { getMyContainers } = require('../scripts/docker');
const { sendInteractionSelectMenuReply } = require('../scripts/message');
const { ROLES: { ADMIN, PLEEB }, removeUser } = require('../scripts/users');
const name = 'unassign';
const description = 'Unassigns user(s) to a docker container';
const optionsArr = [{
	'name' : 'user',
	'description' : 'A user',
}];

const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description)
	.addUserOption(option => option.setName(optionsArr[0].name).setDescription(optionsArr[0].description).setRequired(true));

function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, options, guild:{ roles } } = interaction;
		const user = options.getMember(optionsArr[0].name);

		getMyContainers(author, ADMIN).then((authorContainers) => {
			getMyContainers(user, PLEEB, true).then((userContainers) => {
				userContainers = userContainers.filter(({ name:userContainerName }) => {
					return authorContainers.some(({ name:authorContainerName }) => {
						return authorContainerName === userContainerName;
					});
				});
				sendInteractionSelectMenuReply(interaction, userContainers)
				.then(({ values }) => {
					values.forEach((value) => {
						removeUser(user, value, roles);
					});
					resolve(`Removed ${user.displayName} for ${values.join(',')}`);
				})
				.catch(reject);
			});
		});
	});
}
module.exports = {
	data,
	execute
};