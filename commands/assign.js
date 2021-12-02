const { SlashCommandBuilder } = require('@discordjs/builders');
const { getSelectMenu, createOptions } = require('../scripts/message');
const { getMyContainers } = require('../scripts/docker');
const { ROLES: { ADMIN, PLEEB }, addUser } = require('../scripts/users');
const name = 'assign';
const description = 'Assigns user(s) to a docker container with the applicable role';
const optionsArr = [{
	'name' : 'container',
	'description' : 'Container to be assigned',
}, {
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
	// .addStringOption(option => option.setName(optionsArr[0].name).setDescription(optionsArr[0].description).setRequired(true))
	.addUserOption(option => option.setName(optionsArr[1].name).setDescription(optionsArr[1].description).setRequired(true))
	.addStringOption(option => option.setName(optionsArr[2].name).setDescription(optionsArr[2].description).setRequired(true).addChoices(optionsArr[2].choices));

function execute(interaction) {
	return new Promise((resolve, reject) => {
		const { member:author, user:{ id:authorID }, options, guild:{ roles }, channel } = interaction;
		const user = options.getMember(optionsArr[1].name);
		const assignedRole = options.getString(optionsArr[2].name) || PLEEB;
		getMyContainers(author, ADMIN)
			.then((containers) => {
				if (containers.length !== 0) {
				interaction.reply(
					getSelectMenu('containers',	containers.map(createOptions), 1))
					.then(() => {
						const filter = i => {
							i.deferUpdate();
							return i.user.id === authorID;
						};
						channel.awaitMessageComponent({ filter, componentType:'SELECT_MENU', time: 60000, errors:['time'] })
							.then((selectInteraction) => {
								const { values } = selectInteraction;
								values.forEach((value) => {
									addUser(user, value, roles, assignedRole);
								});
								resolve(`Added ${assignedRole} to ${user.displayName} for ${values.join(',')}`);
							})
							.catch(reject);
					});
				}
				else {
					reject('Sorry no containers to assign');
				}
			}).catch(reject);
	});
}
module.exports = {
	data,
	execute
};