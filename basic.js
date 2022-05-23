const Discord = require('discord.js')
const bot = new Discord.Client({intents: ['GUILDS','GUILD_MESSAGES']})
const config = require('./config.json');

const PREFIX = '!';

bot.on('ready', () => {
    console.log('The bot is online!')
})

bot.on('message', message=> {
    let args = message.content.substring(PREFIX.length).split(" ");

    switch(args[0]){
        case 'ping':
            message.channel.send('pong!')
            break;

        case 'help':
            message.channel.send('help urself lel...')
            break;

        case 'info':
            if (args[1] === 'version'){
                message.channel.send('first version pa lang po')
            }else{
                message.channel.send('invalid argument')
            }
            break;

        case 'clear':
            if(!args[1]) return message.reply('Error. Need second argument')
            message.channel.bulkDelete(args[1]);
            break;

        case 'play':
            if(!args[1]) return message.reply('Error. Need second argument')

    }

})

bot.login(config.token);