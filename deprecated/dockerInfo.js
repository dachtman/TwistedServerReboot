const Docker = require('dockerode');
const { docker:{ protocol, host, port } } = require('../json/config.json');
const { canSeeContainer, ROLES } = require('./users.js');
const { no_containers, NO_ACTION } = require ('../json/errors.json');
const DOCKER_ACTIONS = {
	'RESTART' : 'restart',
	'STOP' : 'stop',
	'START' : 'start',
};

function getDocker() {
	return new Docker({
		protocol,
		host,
		port,
	});
}

function getValidContainers() {
	return new Promise((resolve, reject) => {
		const docker = getDocker();
		docker.listContainers({ all:true }).then((containers) => {
			resolve({ containers, docker });
		}).catch(reject);
	});
}

function getValidContainer(author, containerName, role = ROLES.PLEEB) {
	return new Promise((resolve, reject) => {
		if (canSeeContainer(author, containerName, role)) {
			getValidContainers().then(({ containers, docker }) => {
				containers = containers.filter(({ Names:names }) => {
					const name = names.toString().replace(/\//g, '');
					return containerName.toLowerCase() === name.toLowerCase();
				});
				if (containers.length === 0) {
					reject(no_containers);
				}
				else {
					resolve({ container:containers[0], docker });
				}
			}).catch(reject);
		}
		else {
			reject(no_containers);
		}
	});
}

const getValidContainersNames = function(author) {
	const validContainers = new Promise((resolve, reject) => {
		getValidContainers().then(({ containers, docker }) => {
			const containerArr = containers.filter(({ Names:names }) => {
				const name = names.toString().replace(/\//g, '');
				return canSeeContainer(author, name, ROLES.PLEEB);
			}).map(({ Id:id, Names:names }) => {
				const name = names.toString().replace(/\//g, '');
				return docker.getContainer(id).inspect().then(({ State:{ Status:status } }) => {
					return ({
						name,
						status : status.replace(/(?:^|\s)\S/, (a) => {
							return a.toUpperCase();
						}),
						id,
					});
				});
			});
			resolve(containerArr);
		}).catch(reject);
	});
	return validContainers;
};

function containerAction(author, containerName, action, role = ROLES.ADMIN) {
	return new Promise((resolve, reject) => {
		if (action) {
			getValidContainer(author, containerName, role).then(({ container:{ Id:id }, docker }) => {
				docker.getContainer(id)[action]().then(() => {
					resolve(containerName);
				}).catch(reject);
			}).catch(reject);
		}
		else {
			(
				reject(NO_ACTION)
			);
		}
	});
}

module.exports = {
	getValidContainersNames,
	getValidContainers,
	containerAction,
	DOCKER_ACTIONS,
};