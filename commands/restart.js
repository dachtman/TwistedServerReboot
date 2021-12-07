const { SlashCommandBuilder, roleMention, userMention } = require('@discordjs/builders');
const { ROLES: { ADMIN, PLEEB }, getRoleName, canUserAccessContainer } = require('../scripts/users');
const { DOCKER_ACTIONS : { RESTART }, takeActionOnContainer, getAllMyContainers } = require('../scripts/docker');
const { sendInteractionSelectMenuReply } = require('../scripts/message');
const moment = require('moment');
const RESTART_TIME = moment.duration(5, 'minutes');
const EMOJI_REACTIONS = {
	THUMBS_UP : '👍',
	THUMBS_DOWN : '👎',
};
const name = 'restart';
const description = 'Restart of a docker container, requires a vote to restart';
const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);
function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, guild:{ roles :{ cache } } } = interaction;
		getAllMyContainers(author).then((containers) => {
			sendInteractionSelectMenuReply(interaction, containers)
			.then(({ values }) => {
				const containerName = values.join('');
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
					const response = `${containerName} will be restarted ${RESTART_TIME.humanize(true)}`;
					interaction.editReply({ content:`${response}`, components:[] });
					interaction.channel.send({
						content: `${roles.map(r => r.mention).join(' ')} ${response}\nIf you would like to cancel react with a ${EMOJI_REACTIONS.THUMBS_DOWN}`
					})
					.then((interactionMesasge) => {
						interactionMesasge.react(EMOJI_REACTIONS.THUMBS_DOWN);
						const filter = (reaction, user) => {
							return reaction.emoji.name === EMOJI_REACTIONS.THUMBS_DOWN && !user.bot && canUserAccessContainer(containerName, user, reaction);
						};
						const collector = interactionMesasge.createReactionCollector({ filter, max: 1, time:RESTART_TIME.asMilliseconds() });
						collector.on('collect', (reaction, user) => {
							if (canUserAccessContainer(containerName, user, reaction)) {
								interactionMesasge.edit({ content: `${containerName} restart will be canceled thanks to ${userMention(user.id)}` });
								reaction.remove();
							}
							else {
								interactionMesasge.channel.send({ content: 'Dont be breaking my toys', ephemeral:true });
							}
						});
						collector.on('end', (collected) => {
							if (collected.size === 0) {
								interactionMesasge.reactions.removeAll();
								takeActionOnContainer(containerName, RESTART)
								.then((cn) => {
									const containerResponse = `${cn} has restarted. Please enjoy and play for many more hours`;
									interactionMesasge.edit({ content: containerResponse });
									resolve(containerResponse);
								})
								.catch(reject);
							}
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