require('custom-env').env()
const Discord = require("discord.js")
const client = new Discord.Client({intents:['GUILDS','GUILD_MESSAGES','DIRECT_MESSAGES']})

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }
})
console.log(process.env.TOKEN)
client.login(process.env.TOKEN)