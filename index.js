const Discord = require('discord.js')
const client = new Discord.Client({intents: ['GUILDS','GUILD_MESSAGES','GUILD_VOICE_STATES']})

const config = require('./config.json');

const fs = require('fs');

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler', 'event_handler'].forEach(handler => {
    require(`./handlers/${handler}`)(client, Discord);
})

client.login(config.token);


