const ytdl = require('ytdl-core')
const ytSearch = require('yt-search')

const {MessageEmbed} = require('discord.js');
const { createReadStream } = require('fs');
const {joinVoiceChannel, createAudioResource} = require('@discordjs/voice')
const { createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const { getVoiceConnection } = require('@discordjs/voice')
const { VoiceConnectionStatus, AudioPlayerStatus, entersState } = require('@discordjs/voice');
const { GuildEmoji } = require('discord.js');

const queue = new Map() // global queue will hold the songs for all servers

const player = createAudioPlayer({    //create audio player 
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
    },});

player.on('error', error => {
    console.error(error);
    message.channel.send('Error with player or resource. Skipping song.');
});

const embed_color = '#023570'

module.exports = {
    name: 'play2',
    aliases: ['skip','stop','queue'],
    cooldown: 0,
    description: 'practice music bot',
    async execute(message,args,cmd,client, Discord){

        const voice_channel = message.member.voice.channel;
        if (!voice_channel) return message.channel.send('You need to be in a voice channel to execute this command.')
        const permissions = voice_channel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) return message.channel.send('You do not have the correct permissions')
        if (!permissions.has('SPEAK')) return message.channel.send('You do not have the correct permissions')
        
        const server_queue = queue.get(message.guild.id);

        //whenever player has error, notify that song will be skipped

        if (cmd === 'play2'){
            // first check for possible errors and if url links are legit

            if (!args.length) return message.channel.send('You need to send a song or link to a song');
            let song = {};

            if (ytdl.validateURL(args[0])){
                const song_info = await ytdl.getInfo(args[0]);
                song = {title: song_info.videoDetails.title, url: song_info.videoDetails.video_url}
            } else{
                //if the person sends a song name and not link
                const video_finder = async (query) =>{
                    const videoResult = await ytSearch(query);
                    return (videoResult.videos.length > 1) ? videoResult.videos[0] : null; 
                }

                const video = await video_finder(args.join(' '));
                if (video){
                    song = { title:  video.title, url: video.url}
                } else {
                    message.channel.send('Error finding the video');
                }

            }

            //end checking

            //start of actual playing of songs
            
            
            if (!server_queue){
                const queue_constructor = {
                    voice_channel: voice_channel,
                    text_channel: message.channel,
                    connection: null,
                    songs: []
                }
    
                queue.set(message.guild.id, queue_constructor);
                queue_constructor.songs.push(song);
    
                try {
                    const connection = await joinVoiceChannel({
                        channelId: message.member.voice.channel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator
                    });
                    
                    
                    connection.subscribe(player);
                    queue_constructor.connection = connection;
                    console.log('established voice connection');
                    console.log('Went inside if ( no server_queue)');
                    
                    
                    //play initial song
                    console.log('playing first song');
                    player.play(get_next_audioresource(queue_constructor.songs[0]));
                    message.channel.send(`Now playing **${queue_constructor.songs[0].title}**`);
                    //queue_constructor.songs.shift();

                    //attach event to player whenver it "finishes" a song
                    player.on(AudioPlayerStatus.Idle , () => {
                        const song_queue = queue.get(message.guild.id);

                        if (!song_queue.songs[1]){
                            console.log('no more songs, trying to exit code');
                            queue.delete(message.guild.id);
                            getVoiceConnection(message.guild.id)?.destroy();
                            queue.delete(message.guild.id);
                            console.log('Got here! Destroyed connection')
                            message.channel.send('No more songs. Bye!');
                            return;
                        } else{
                            player.play(get_next_audioresource(song_queue.songs[1]));
                            message.channel.send(`Now playing **${song_queue.songs[1].title}**`);
                            song_queue.songs.shift();
                        }
                    }); 

                    //recurs_play(player,message,queue_constructor.songs[0]); // what if iterative si play function
                } catch (err) {
                    queue.delete(message.guild.id);
                    message.channel.send('There is an error connecting.');
                    throw err;
                }
            } else{
                console.log('went inside else (there is a server queue)');
                server_queue.songs.push(song);
                const addqueueEmbed = new MessageEmbed().setDescription(`👍 **${song.title}** added to queue!`).setColor(embed_color);
                await message.channel.send({embeds : [addqueueEmbed]});

                return;
            }
        }
        else if(cmd === 'skip') skip(player, message, server_queue);
        else if(cmd === 'stop') stop(player, message, server_queue);
        else if(cmd === 'queue') show_queue(message, server_queue);
    }
}


//play youtube video function
const recurs_play = async (playerarg,message, song, voice_connection) => {
    //update song queue from global queue
    const song_queue = queue.get(message.guild.id);
    
    //if there is no more songs, disconnect from voice channel
    if (!song) {  
        //message.channel.send('No more songs. Bye!');
        console.log('no more songs, trying to execute exit code');
        //song_queue.songs = [];

        // if (!getVoiceConnection(message.guild.id)){
        //     queue.delete(message.guild.id);
        //     console.log('Got here! nothing to destroy')
        //     message.channel.send('A) No more songs. Bye!');
        //     return;
        // }

        getVoiceConnection(message.guild.id)?.destroy();
        queue.delete(message.guild.id);
        console.log('Got here! Destroyed connection')

        const nosongsEmbed = new MessageEmbed().setDescription('No more songs. Bye!').setColor(embed_color);
        await message.channel.send({embeds: [nosongsEmbed]});
        return;
            
    } 
    //play the song
    const stream = ytdl(song.url, {filter: 'audioonly'});  
    const resource = createAudioResource(stream);
    playerarg.play(resource);
    console.log('Playback has started!');
    // try {
    // 	await entersState(player, AudioPlayerStatus.Playing, 5_000);
        
    // //The player has entered the Playing state within 5 seconds
    // 	console.log('Playback has started!');
    // } catch (error) {
    //     	// The player has not entered the Playing state and either:
    //     	// 1) The 'error' event has been emitted and should be handled
    //     	// 2) 5 seconds have passed
    //     	console.error(error);
    //     }
    const nowplayingEmbed = new MessageEmbed().setDescription(`🎵 Now playing **${song.title}**`).setColor(embed_color);
    await message.channel.send({embeds: [nowplayingEmbed]});
    //song_queue.text_channel.send(`Now playing **${song.title}**`);
    //wait until the audioplayer is in Idle (after a song is finished) then loop again 
    
    // playerarg.once('error', error => {
    //     console.error('Error:', error.message, 'with track', error.resource); //${error.resource.metadata.title}
    //     //message.channel.send('Error with resource. Moving to next song.');
    //     song_queue.songs.shift();
    //     return recurs_play(playerarg,message,song_queue.songs[0]);
    // });
    playerarg.once(AudioPlayerStatus.Idle, ()=>{
        console.log('song has finished, playing next song');
        song_queue.songs.shift();
        return recurs_play(playerarg,message,song_queue.songs[0]);
    });

        //if there is an error, skip song then loop again
        
}

//stop the playlist function
const stop = async (playerarg, message, serverqueue) => {
    if (!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this command!');
    if (!getVoiceConnection(message.guild.id)) return;

    //remove attached .once() event handler
    playerarg.off(AudioPlayerStatus.Idle, ()=>{
        console.log('song has finished, playing next song');
        song_queue.songs.shift();
        return recurs_play(playerarg,message,song_queue.songs[0]);
    });

    serverqueue.songs = [];
    getVoiceConnection(message.guild.id).destroy();
    queue.delete(message.guild.id);
    const stopEmbed = new MessageEmbed().setDescription('Stopped. Good bye.').setColor(embed_color);
    await message.channel.send({embeds: [stopEmbed]});
    return;
}

const show_queue = async (message, serverqueue) => {
    if (!message.member.voice.channel){ 
        const nochannelEmbed = new MessageEmbed().setDescription('You need to be in a channel to execute this command!').setColor(embed_color);
        await message.channel.send({embeds: [nochannelEmbed]});
        return;
    }
    if (!serverqueue) {
        const noqueueEmbed = new MessageEmbed().setDescription('No queue... PAQUEUE 🖕').setColor(embed_color);
        await message.channel.send({embeds: [noqueueEmbed]});
        return;
    }

    const queueList = serverqueue.songs.map((song, i) => `${++i} - ${song.title} \n`);
    const queueEmbed = new MessageEmbed().addFields(
        {name: 'Song Queue', value: queueList.toString().replace(/,/g,'')}
        ).setColor(embed_color);
    //console.log(typeof(require('util').inspect(serverqueue.songs)));
    await message.channel.send({embeds: [queueEmbed]});
    return;
}

const skip = async (playerarg, message, serverqueue) => {
    if (!message.member.voice.channel){ 
        const nochannelEmbed = new MessageEmbed().setDescription('You need to be in a channel to execute this command!').setColor(embed_color);
        await message.channel.send({embeds: [nochannelEmbed]});
        return;
    }
    if (!getVoiceConnection(message.guild.id)) return;
    
    playerarg.stop();
    console.log('Song skipped');
    const skipEmbed = new MessageEmbed().setDescription(`Skipped **${serverqueue.songs[0].title}**`).setColor(embed_color);
    await message.channel.send({embeds: [skipEmbed]});
    // serverqueue.songs.shift();
    // video_player(playerarg,message,serverqueue.songs[0]);  
    return;
}


const get_next_audioresource = async (song) =>{
    const stream = ytdl(song.url, {filter: 'audioonly'});  
    const resource = createAudioResource(stream);
    return resource;
}





