module.exports = {
    name: 'ping',
    description: 'ping command',
    execute(message,args,client, Discord){
        message.channel.send('pongers!');

    }
}