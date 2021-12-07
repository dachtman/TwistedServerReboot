const { SlashCommandBuilder } = require('@discordjs/builders');
const { ROLES: { ADMIN } } = require('../scripts/users');
const { sendInteractionSelectMenuReply } = require('../scripts/message');
const { DOCKER_ACTIONS : { START }, takeActionOnContainer, getMyContainers } = require('../scripts/docker.js');
const name = 'start';
const description = 'Start a docker container';
const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);
function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author } = interaction;
		// if (isAdmin(author)) {
		getMyContainers(author, ADMIN)
		.then((containers) => {
			sendInteractionSelectMenuReply(interaction, containers)
			.then(({ values }) => {
				interaction.editReply({ content: `Preparing to start ${values}`, components:[] });
				takeActionOnContainer(values, START)
					.then((cn) => {
						resolve(`${cn} has started`);
					})
					.catch(reject);
			})
			.catch(reject);
		})
		.catch(reject);
	});
		// }
		// else {
		//	reject('No no no, you cant do this');
		// }
}

module.exports = {
	data,
	execute
};