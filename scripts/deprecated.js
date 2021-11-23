if (msg.mentions.has(client.user.id)) {
    if (users.getAuthorizedUsers().indexOf(msg.author.username) !== -1) {
      if (msg.author.username === "twistedsistem") {
        msg.channel.send("I dont wanna!!!")
        return;
      }
      let msgContent = msg.content.replace(/<@!.*>\s*/g, "");
      switch (msgContent) {
        case "list dockers":
          msg.channel.send(dockerInfo.getValidContainers(docker).join("\n*"));
          break;
        default:
          msg.channel.send("I got your message!");
          break;
      }
    }
  }