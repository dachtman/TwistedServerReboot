const Docker = require('dockerode');
const { uniq } = require('underscore');
const { canUserDoThis, ROLES: { PLEEB, ADMIN } } = require('./users.js');
const { docker:{ protocol, host, port } } = require('../json/config.json');
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

function getContainers() {
	return new Promise((resolve, reject) => {
		const docker = getDocker();
		docker.listContainers({ all:true }).then((containers) => {
			containers = containers.map((container) => {
				const { Names:names } = container;
				return {
					name : names.toString().replace(/\//g, ''),
					... container
				};
			});
			resolve({ containers, docker });
		}).catch(reject);
	});
}

function getContainer(containerName) {
	return new Promise((resolve, reject) => {
		getContainers().then(({ containers, docker }) => {
			containers = containers.filter(({ Names:names }) => {
				const name = names.toString().replace(/\//g, '');
				return containerName.toString().toLowerCase() === name.toLowerCase();
			});
			resolve({ container:containers[0], docker });
		}).catch(reject);
	});
}

function getAllMyContainers(user) {
	return new Promise((resolve, reject) => {
		getMyContainers(user, PLEEB, false)
			.then((pleebContainers) => {
				getMyContainers(user, ADMIN, false)
					.then((adminContainers) => {
						resolve(uniq([...pleebContainers, ...adminContainers]));
					})
					.catch(reject);
			})
			.catch(reject);
	});
}

function getMyContainers(user, requiredRole = PLEEB, ignoreSuperAdmins) {
	return new Promise((resolve, reject) => {
		getContainers()
			.then(({ containers }) => {
				resolve(containers.filter(({ name }) => {
					return canUserDoThis(user, name, requiredRole, ignoreSuperAdmins);
				}));
			})
			.catch(reject);
	});
}

function getContainersInfo(author) {
	return new Promise((resolve, reject) => {
		getAllMyContainers(author)
			.then((containers) => {
				resolve(containers.map(({ name, State:status, Status:state }) => { return { name, state, status };}));
			})
			.catch(reject);
	});
}

function takeActionOnContainer(containerName, action) {
	return new Promise((resolve, reject) => {
		if (action) {
			getContainer(containerName).then(({ container:{ Id:id }, docker }) => {
				docker.getContainer(id)[action]().then(() => {
					resolve(containerName);
				}).catch(reject);
			}).catch(reject);
		}
	});
}

module.exports = {
	takeActionOnContainer,
	getContainersInfo,
	getContainers,
	getMyContainers,
	DOCKER_ACTIONS
};
