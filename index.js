const Discord = require('discord.js')
const client = new Discord.Client({intents: ['GUILDS','GUILD_MESSAGES','GUILD_VOICE_STATES']})

const token = 'ODg2OTE4NjY4OTUxMzc5OTg4.YT8lYA.4-AAguu7BJ96HmQw91lbeRnqQH0';

const fs = require('fs');

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler', 'event_handler'].forEach(handler => {
    require(`./handlers/${handler}`)(client, Discord);
})

client.login(token);


