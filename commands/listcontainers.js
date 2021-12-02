const { SlashCommandBuilder } = require('@discordjs/builders');
const { getContainersInfo } = require('../scripts/docker');
const { getListDockerEmbed } = require('../scripts/message');
const name = 'listcontainers';
const description = 'List available docker containers';

const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);

function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author } = interaction;
		getContainersInfo(author)
		.then((containers) => {
			resolve({ embeds : [getListDockerEmbed(containers)], ephemeral: true });
		})
		.catch(reject);
	});
}

module.exports = {
	data,
	execute
};