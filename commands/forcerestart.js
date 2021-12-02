const { SlashCommandBuilder } = require('@discordjs/builders');
const { ROLES: { ADMIN }, isAdmin } = require('../scripts/users.js');
const { sendInteractionSelectMenuReply } = require('../scripts/message');
const { DOCKER_ACTIONS : { RESTART }, takeActionOnContainer, getMyContainers } = require('../scripts/docker.js');
const name = 'forcerestart';
const description = 'Force restart of a docker container, does not require a vote to start';
const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);
function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, user:{ id:authorID }, channel } = interaction;
		if (isAdmin(author)) {
			getMyContainers(author, ADMIN)
			.then((containers) => {
				sendInteractionSelectMenuReply(interaction, containers)
				.then(({ values }) => {
					takeActionOnContainer(values, RESTART)
					.then(() => {
						resolve(`Restart started on ${values}`);
					})
					.catch(reject);
				})
				.catch(reject);
			});
		}
		else {
			reject('No no no, you cant do this');
		}
	});
}

module.exports = {
	data,
	execute
};