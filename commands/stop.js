const { SlashCommandBuilder } = require('@discordjs/builders');
const { ROLES: { ADMIN } } = require('../scripts/users');
const { DOCKER_ACTION : STOP, takeActionOnContainer, getMyContainers } = require('../scripts/docker');
const { getSelectMenu, createOptions } = require('../scripts/message');
const name = 'stop';
const description = 'Stop a docker container';
const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);
function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, user:{ id:authorID }, channel } = interaction;
		// if (isAdmin(author)) {
		getMyContainers(author, ADMIN).then((containers) => {
			interaction.reply(
				getSelectMenu('containers',	containers.map(createOptions)))
				.then(() => {
					const filter = i => {
						i.deferUpdate();
						return i.user.id === authorID;
					};
					channel.awaitMessageComponent({ filter, componentType:'SELECT_MENU', time: 60000, errors:['time'] })
						.then(({ values }) => {
							takeActionOnContainer(values, STOP)
								.then(() => {
									resolve(`Stopping ${values}`);
								})
								.catch(reject);
						})
						.catch(reject);
				});
		});
		// }
		// else {
		//	reject('No no no, you cant do this');
		// }
	});
}

module.exports = {
	data,
	execute
};