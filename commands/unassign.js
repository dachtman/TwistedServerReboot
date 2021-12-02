const { SlashCommandBuilder } = require('@discordjs/builders');
const { getMyContainers } = require('../scripts/docker');
const { getSelectMenu, createOptions } = require('../scripts/message');
const { ROLES: { ADMIN, PLEEB }, removeUser } = require('../scripts/users');
const name = 'unassign';
const description = 'Unassigns user(s) to a docker container';
const optionsArr = [{
	'name' : 'container',
	'description' : 'Container to be unassigned',
}, {
	'name' : 'user',
	'description' : 'A user',
}];

const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description)
	.addUserOption(option => option.setName(optionsArr[1].name).setDescription(optionsArr[1].description).setRequired(true));

function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, user:{ id:authorID }, options, guild:{ roles }, channel } = interaction;
		const user = options.getMember(optionsArr[1].name);

		getMyContainers(author, ADMIN).then((authorContainers) => {
			getMyContainers(user, PLEEB, true).then((userContainers) => {
				userContainers = userContainers.filter(({ name:userContainerName }) => {
					return authorContainers.some(({ name:authorContainerName }) => {
						return authorContainerName === userContainerName;
					});
				}).map(createOptions);
				if (userContainers.length !== 0) {
				interaction.reply(getSelectMenu('containers', userContainers, 1))
					.then(() => {
						const filter = i => {
							i.deferUpdate();
							return i.user.id === authorID;
						};
						channel.awaitMessageComponent({ filter, componentType:'SELECT_MENU', time: 60000, errors:['time'] })
							.then(({ values }) => {
								values.forEach((value) => {
									removeUser(user, value, roles);
								});
								resolve(`Removed ${user.displayName} for ${values.join(',')}`);
							})
							.catch(reject);
					});
				}
				else {
					reject('Sorry no containers to unassign');
				}
			});
		});
	});
}
module.exports = {
	data,
	execute
};