const { SlashCommandBuilder, roleMention } = require('@discordjs/builders');
const { ROLES: { ADMIN, PLEEB }, getRoleName, canUserDoThis } = require('../scripts/users');
const { DOCKER_ACTIONS : RESTART, takeActionOnContainer, getMyContainers } = require('../scripts/docker');
const { createOptions, getSelectMenu, getButtonRow } = require('../scripts/message');
const name = 'restart';
const description = 'Restart of a docker container, requires a vote to restart';
const data = new SlashCommandBuilder()
	.setName(name)
	.setDescription(description);
function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, user:{ id:authorID }, guild:{ roles :{ cache } }, channel } = interaction;
		getMyContainers(author, ADMIN, false).then((containers) => {
			interaction.reply(
				getSelectMenu('containers',	containers.map(createOptions)))
				.then(() => {
					const filter = i => {
						i.deferUpdate();
						return i.user.id === authorID;
					};
					channel.awaitMessageComponent({ filter, componentType:'SELECT_MENU', time: 60000, errors:['time'] })
						.then(({ values }) => {
							const containerName = values.join('');
							let yesVotes = [];
							let noVotes = [];
							const roles = [getRoleName(containerName, ADMIN), getRoleName(containerName, PLEEB)].map((roleName) => {
								const { id, members: { size: count } } = cache.find(r => r.name === roleName);
								return {
									mention:roleMention(id),
									count
								};
							});
							interaction.editReply({
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
									const collector = interactionReply.createMessageComponentCollector({ componentType: 'BUTTON', time:60000 });
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
									});
								})
								.catch(reject);
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