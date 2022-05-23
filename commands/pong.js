module.exports = {
    name: 'pong',
    description: 'pong command',
    execute(message,args, client, Discord){
        message.channel.send('pingers!');

    }
}