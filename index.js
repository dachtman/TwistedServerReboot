require("dotenv").config();
const Docker = require("dockerode");
const Discord = require("discord.js");
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"]
})
const docker = new Docker({host:process.env.DOCKER_IP});
docker.listContainers((err,containers)=>{
  containers.forEach((container) => {
    console.log(container.id);
  })
})

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("messageCreate", msg => {
  
})
client.login(process.env.TOKEN);