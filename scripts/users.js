const { Role, Formatters } = require("discord.js");
const file = require("./file.js");
const FILE_NAME = "users.json";
const {HEY,VOTE_INSTRUCTIONS,VOTE_AGREEMENT,NO_RESTART} = require ("../json/responses.json");
const REACTION_TIME = 30000;
const ROLES = {
    ADMIN: "admin",
    PLEEB: "pleeb"
}
const EMOJI_REACTIONS = {
    THUMBS_UP : '👍',
    THUMBS_DOWN : '👎'
}
const filter = (r,u) => {
    return r.emoji.name === EMOJI_REACTIONS.THUMBS_UP || r.emoji.name === EMOJI_REACTIONS.THUMBS_DOWN;
}
//TODO
//THINK ABOUT CHECKING PERMISSIONS HERE
function getUserFile() {
    return file.getJSONFile(FILE_NAME);
}

function getAuthorizedUsers (){
    return getUserFile().SUPER_ADMIN;
}

function setUserFile(userJSON) {
    file.setJSONFile(FILE_NAME, userJSON);
}

function canUserDoThis(userJSON, userID, containerID, roleRequired = ROLES.ADMIN) {
    containerID = containerID.toLowerCase();
    if (userJSON[userID]) {
        if (userJSON[userID].SUPER_ADMIN){
            return true;
        }
        if (userJSON[userID][containerID]) {
            if (userJSON[userID][containerID] === roleRequired || (roleRequired === ROLES.PLEEB && userJSON[userID][containerID] === ROLES.ADMIN)) {
                return true;
            }
        }
    }
    return false;
}

function getUsersByContainer ({id:authorID},containerID) {
    let users = [];
    let userJSON = getUserFile();
    if(canUserDoThis(userJSON, authorID, containerID, ROLES.PLEEB)){
        for(const user in userJSON){
            if(userJSON[user][containerID.toLowerCase()]){
                users.push(user);
            }
        }
    }
    return users;
}

function canSeeContainer ({id:authorID},containerID,role = ROLES.PLEEB){
    let userJSON = getUserFile();
    return canUserDoThis(userJSON,authorID,containerID);
}

function addUser ({
    id: authorID,
    username
}, {
    id: userID,
    displayName
}, containerID, role = ROLES.PLEEB) {
    role = role === ROLES.PLEEB || role === ROLES.ADMIN ? role : ROLES.PLEEB;
    containerID = containerID.toLowerCase();
    let userJSON = getUserFile();
    if (canUserDoThis(userJSON, authorID, containerID)) {
        if (!userJSON[userID]) {
            userJSON[userID] = {
                displayName
            };
        }
        userJSON[userID][containerID] = role;
        setUserFile(userJSON);
        file.writeToLogFile(username, `assigned ${containerID} to ${displayName} with ${role}`)
        return true;
    }
    return false;
}
function removeUser ({id:authorID,username},{id: userID,displayName}, containerID) {
    let userJSON = getUserFile();
    if (canUserDoThis(userJSON, authorID, containerID)) {
        if (userJSON[userID] && userJSON[userID][containerID]) {
            delete userJSON[userID][containerID];
            setUserFile(userJSON);
            file.writeToLogFile(username, `unassigned ${containerID} to ${displayName}`)
            return true;
        }
    }
    return false;
}
//TODO
//Move to messages
function runVoting (author, containerName, msg) {
    const members = getUsersByContainer(author, containerName);
    const membersRxTr = {};
    members.forEach( (m) => {
        membersRxTr[m] = {
            vote:undefined,
            reaction:undefined
        }
    });
    return new Promise( (resolve, reject) => {
        msg.channel.send(`${HEY} ${members.map((m)=>Formatters.memberNicknameMention(m)).join(" ")} ${containerName} ${VOTE_INSTRUCTIONS}`)
        .then( (m) => {
            m.react(EMOJI_REACTIONS.THUMBS_UP);
            m.react(EMOJI_REACTIONS.THUMBS_DOWN);
            const collector = m.createReactionCollector({filter, time:REACTION_TIME});
            collector.on('collect',(r,u) => {
                if(u.id in membersRxTr){
                    if(membersRxTr[u.id].reaction){
                        membersRxTr[u.id].reaction.users.remove(u);
                    }
                    membersRxTr[u.id].vote = r.emoji.name === EMOJI_REACTIONS.THUMBS_UP;
                    membersRxTr[u.id].reaction = r;
                }
            });
            collector.on('end',(collection) => {
                let yesCount = 0;
                let noCount = 0;
                members.forEach((m)=>{
                    if(membersRxTr[m].vote){
                        yesCount++;
                    }else{
                        noCount++;
                    }
                });
                if(yesCount === members.length){
                    resolve(m);
                }else{
                    reject(m);
                }
            });
        });
    });
}

module.exports = {
    EMOJI_REACTIONS,
    ROLES,
    getAuthorizedUsers,
    canSeeContainer,
    getUsersByContainer,
    runVoting,
    addUser,
    removeUser
}