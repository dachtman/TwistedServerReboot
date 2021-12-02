const { SlashCommandBuilder, roleMention } = require('@discordjs/builders');
const { ROLES: { ADMIN, PLEEB }, getRoleName, canUserDoThis } = require('../scripts/users');
const { DOCKER_ACTIONS : { RESTART }, takeActionOnContainer, getMyContainers } = require('../scripts/docker');
const { getButtonRow, sendInteractionSelectMenuReply } = require('../scripts/message');
const name = 'restart';
const description = 'Restart of a docker container, requires a vote to restart';
const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);
function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, guild:{ roles :{ cache } } } = interaction;
		getMyContainers(author, ADMIN, false).then((containers) => {
			sendInteractionSelectMenuReply(interaction, containers)
			.then(({ values }) => {
				const containerName = values.join('');
				let yesVotes = [];
				let noVotes = [];
				const roles = [getRoleName(containerName, ADMIN), getRoleName(containerName, PLEEB)]
				.filter((roleName) => {
					return cache.find(r => r.name === roleName);
				})
				.map((roleName) => {
					const { id, members: { size: count } } = cache.find(r => r.name === roleName);
					return {
						mention:roleMention(id),
						count
					};
				});
				if (roles.length !== 0) {
					interaction.editReply({ content: `${containerName} will be put up for a vote to be restarted`, components:[] });
					interaction.channel.send({
						content: `${roles.map(r => r.mention).join(' ')} ${containerName} is going to be restarted please vote now`,
						components:[getButtonRow([{
							customID : 'yes',
							label: `Yes (${yesVotes.length})`,
							style: 'PRIMARY'
						}, {
							customID : 'no',
							label: `No (${noVotes.length})`,
							style: 'DANGER'
						}])]
					})
					.then((interactionReply) => {
						const collector = interactionReply.createMessageComponentCollector({ componentType: 'BUTTON', time:10000 });
						collector.on('collect', (i) => {
							const { customId, user: { id: userId }, member, message: { components } } = i;
							if (canUserDoThis(member, containerName, true)) {
								const alreadyVotedYes = yesVotes.includes(userId);
								const alreadyVotedNo = noVotes.includes(userId);
								if (!alreadyVotedYes || !alreadyVotedNo) {
									if (customId === 'yes' && !alreadyVotedYes) {
										yesVotes.push(userId);
										noVotes = noVotes.filter((v) => v !== userId);
									}
									if (customId === 'no' && !alreadyVotedNo) {
										noVotes.push(userId);
										yesVotes = yesVotes.filter((v) => v !== userId);
									}
									components[0].components[0].setLabel(`Yes (${yesVotes.length})`);
									components[0].components[1].setLabel(`No (${noVotes.length})`);
								}
								i.update({ components });
							}
						});
						collector.on('end', () => {
							const memberCount = roles.reduce((prevValue, { count }) => {
								return prevValue + count;
							}, 0);
							if (yesVotes.length === memberCount) {
								takeActionOnContainer(containerName, RESTART)
									.then(() => {
										resolve(`Restart started on ${containerName}`);
									})
									.catch(reject);
							}
							else {
								reject('NO RESTART');
							}
							interactionReply.delete();
						});
					})
					.catch(reject);
				}
				else {
					reject('There are no users for this container');
				}
			})
			.catch(reject);
		});
	});
}

module.exports = {
	data,
	execute
};