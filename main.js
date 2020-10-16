const Discord = require('discord.js');
const cfg = require('./config');

const client = new Discord.Client();

let listNow = [];
let listLater = [];
let listDisconnected = [];
let msg;
let ready = true;
let changed = false;
let wyslano = false;
const embed = new Discord.MessageEmbed()

const log = (info) => {
	const now = new Date();
	console.log(
		`[${now
			.getHours()
			.toString()
			.padStart(2, '0')}:${now
			.getMinutes()
			.toString()
			.padStart(2, '0')}.${now
			.getSeconds()
			.toString()
			.padStart(2, '0')}] ${info}`,
	);
};

const createMessage = (list, listAfk) => {
	changed && log(`Requested new ping message`);
	let ludzie = '';
	if (list.length) {
		log(`Lista: ${list}`);
		ludzie += `\n*Osoby chętne do gry:*  **${list.length}/10** \n`;
		list.forEach((item) => (ludzie += `<@${item}>\n`));
	}
	if (listAfk.length && !wyslano) {
		log(`Lista AFK: ${listAfk}`);
		ludzie += `\n*Osoby chętne na później:*  **${listAfk.length}** \n`;
		listAfk.forEach((item) => (ludzie += `<@${item}>\n`));
	}

	if (list.length + listAfk.length >= 10 && listAfk.length > 0 && !wyslano && list.length < 10)
		return cfg.descriptionAFK + ludzie;
	if (list.length >= 10 && !wyslano)
		return cfg.descriptionREADY + ludzie;

	return cfg.description + ludzie;
};

const removeUser = (user, list) => {
	const position = list.indexOf(user);
	if (position > -1) {
		log(`Removed (${user}) from list`);
		list.splice(position, 1);
		changed = true;
		return true;
	}
	return false;
};

const addUser = (user, listAdd, listRemove) => {
	removeUser(user, listRemove);

	if (listAdd.indexOf(user) == -1) {
		log(`Added (${user}) to list`);
		listAdd.push(user);
		changed = true;
		return true;
	}
	return false;
};

const sendDM = (list, message, filter, embed) => {

	const embedDM = new Discord.MessageEmbed()
		.setTitle("Zebrał się skład! Chcesz już teraz zagrać?")
		.setColor(0xff0000)
		.setDescription("Kliknij ✅ jeśli możesz grać, \njeśli nie, zignoruj tą wiadomość.\n\n*Wiadomość ulegnie samozniszczeniu za 5 minut*")
		.setThumbnail('https://i.imgur.com/VdLgAxI.png');

		list.forEach((item) => {
			message.guild.members.fetch(item).then(
				user => user.send(embedDM).then(
					msgDM => msgDM.react('✅').then(
						() => {
							let usunieto = false;
							let collector = msgDM.createReactionCollector(filter);
							collector.on('collect', async (reaction, user) => {
									log(`User: ${user.tag} clicked reaction: ${reaction.emoji} in Private Message`);
									addUser(user.id, listNow, listLater);
									
									embed.setDescription(createMessage(listNow, listLater));

									message.edit(cfg.group, embed);
									const tempEmbed = new Discord.MessageEmbed()
										.setColor(0x00cc00)
										.setDescription(`**Dodałem Cię do listy chętnych na grę.\nKliknij [TUTAJ](${message.url}) , aby przejść na serwer.**`);
									user.send(tempEmbed).then(
										info => info.delete({ timeout: 15000}).then(
											msgDM.delete().then(
												usunieto = true
											)
										)
									);
							})
							setTimeout(function(){
								if(!usunieto)
								msgDM.delete();
							},60000)
						}
						
					)		
				)
			)
		});

}







const sendDMReady = (list, message) => {

	const embedDM = new Discord.MessageEmbed()
		.setTitle("Mamy full ekipę! Wejdź na kanał!")
		.setColor(0xff0000)
		.setDescription("Kliknij **[TUTAJ](https://discord.gg/MZpPt3e)**, aby przejść na kanał głosowy!\n*Wiadomość ulegnie samozniszczeniu za 1 minutę.*")
		.setThumbnail('https://i.imgur.com/VdLgAxI.png');

		list.forEach((item) => {
			message.guild.members.fetch(item).then(
				user => user.send(embedDM).then(
					msg => msg.delete({timeout: 60000})
				)
			)}
		)
}











const sendError = (channel, text) => {
	const embedfun = new Discord.MessageEmbed()
		.setColor(0xffa500)
		.setDescription(text);
	channel.send(embedfun).then(msg => setTimeout(() => msg.delete(), 7500));

}

const sendInfo = (channel, title, text) => {
	const embedfun = new Discord.MessageEmbed()
		.setTitle(title)
		.setColor(0xffa500)
		.setDescription(text);
	channel.send(embedfun).then(msg => setTimeout(() => msg.delete(), 30000));

}


client.once('ready', () => log(`Successfully logged in as: ${client.user.tag}`));

client.on('message', async (message) => {
	if (!message.content.startsWith(cfg.prefix) || message.author.bot) return;
	const args = message.content.slice(cfg.prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
	const channel = message.channel;
	const guild = message.guild;
	const author = message.author;
	let taggedUser;

	if(message.mentions.users.size)
		taggedUser = message.mentions.users.first();

	message.delete().catch(console.error);
	console.log(`Komenda: ${command}, Argumenty: ${args}`);
	
	if (command === 'ping' && !args.length && ready) {
		ready = false;

		embed
			.setTitle(
				'<:auselfreport:763026312117747782> Kto chętny na grę w **Among Us**? <:auselfreport:763026312117747782>',
			)
			.setColor(0xff0000)
			.setDescription(cfg.description)
			.setThumbnail('https://i.imgur.com/VdLgAxI.png');

		if (listNow.length || listLater.length) {
			log('Refreshing ping message');
			msg.delete();
			embed.setDescription(createMessage(listNow, listLater));
		}

		msg = await channel.send(cfg.group, embed);

		cfg.reactions.map(async (reaction) => {
			const emoji = guild.emojis.cache.find(
				(emoji) => emoji.name === reaction,
			);
			log(`Added reaction (${emoji}) to message`);
			await msg.react(emoji);
		});

		ready = true;

		const filter = (_reaction, user) => user.id !== msg.author.id;

		const collector = msg.createReactionCollector(filter);

		collector.on('collect', async (reaction, user) => {
			changed = false;
			wyslano = false;

			log(`User: ${user.tag} clicked reaction: ${reaction.emoji}`);

			switch (reaction.emoji.name) {
				case cfg.reactions[0]:
					addUser(user.id, listNow, listLater);
					break;
				case cfg.reactions[1]:
					addUser(user.id, listLater, listNow);
					break;
				case cfg.reactions[2]:
					removeUser(user.id, listNow);
					removeUser(user.id, listLater);
					break;
				case '⏰':
					sendDM(listLater, msg, filter, embed);
					sendError(channel, `**Wysłano wiadomość do osób chętnych na później**`);
					log(`Sending Private Message to AFK users.`)
						
					wyslano = true;
					msg.reactions.cache.get('⏰').remove();
					embed.setDescription(createMessage(listNow, listLater));
					msg.edit(cfg.group, embed);
					setTimeout(function(){
						listLater = [];
						embed.setDescription(createMessage(listNow, listLater));
						msg.edit(cfg.group, embed);
					}, 60000);
					break;
				case '📨':
					sendDMReady(listNow, msg);
					sendError(channel, `**Wysłano wiadomość informującą o pełnym składzie!**`);
					log(`Sending Private Message to users about full squad.`)
						
					wyslano = true;
					msg.reactions.cache.get('📨').remove();
					embed.setDescription(createMessage(listNow, listLater));
					msg.edit(cfg.group, embed);
					break;	
			}

			if (listNow.length + listLater.length >= 10 && !wyslano && listLater.length > 0 && listNow.length < 10)
			{
				wyslano = false;
				if(!msg.reactions.cache.get('⏰')){
					msg.react('⏰');

				}
			}

			if (listNow.length >= 10 && !wyslano)
			{
				wyslano = false;
				if(!msg.reactions.cache.get('📨')){
					msg.react('📨');

				}
			}

			reaction.users.remove(user);

			embed.setDescription(createMessage(listNow, listLater));

			if (changed) {
				msg.edit(cfg.group, embed);
			}
		});
	} else if (args[0] === 'end') {
		log(`Removing ping message...`);

		if (listNow.length || listLater.length || typeof msg !== 'undefined') {
			msg.delete().catch(console.error);
			listNow = [];
			listLater = [];
			sendError(channel, `**Zakończono sprawdzanie obecności**`);
		} else {
			log(`No message found, omitting.`);
			sendError(channel, 'Brak aktywnej listy 🤦‍♂️');
		}
	} else if (args[0] === 'delete') {
		if (!taggedUser)
			return sendError(channel, `**Otaguj użytkownika, którego chcesz usunąć.**\nnp. **!ping delete <@${author.id}>** `);

		if (removeUser(taggedUser.id, listNow) || removeUser(taggedUser.id, listLater))
		{
			embed.setDescription(createMessage(listNow, listLater));
			msg.edit(cfg.group, embed);
			sendError(channel, `**Poprawnie usunięto użytkownika: ${taggedUser.username} z list.**`)
		} else
			sendError(channel, `Nie znaleziono użytkownika: **${taggedUser.username}** na żadnej z list.`)
		

	} else if (args[0] === 'help') {
		return sendInfo(channel, `Komendy ${cfg.prefix}ping`, `
			**${cfg.prefix}ping** - włączenie / odświeżenie listy
			**${cfg.prefix}ping help** - to okno pomocy
			**${cfg.prefix}ping end** - wyłączenie / usunięcie listy
			**${cfg.prefix}ping delete <@${author.id}>** - usunięcie użytkownika z listy
		`)

	}

});

client.login(cfg.token);
log(`Logging in...`);
