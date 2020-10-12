const Discord = require('discord.js');
const cfg = require('./config');

const client = new Discord.Client();

let lista = [];
let listaafk = [];
let msg;
let ready = true;
let changed = false;

client.once('ready', () => console.log('Ready!'));

const createMessage = (list, listAfk) => {
	let ludzie = '';
	if (list.length) {
		console.log(`Lista: ${list}`);
		ludzie += `*Osoby chętne do gry:*  **${list.length}/10** \n`;
		list.forEach((item) => (ludzie += `<@${item}>\n`));
	}
	if (listAfk.length) {
		console.log(`Lista AFK: ${listAfk}`);
		ludzie += `\n*Osoby chętne na później:*  **${listAfk.length}** \n`;
		listAfk.forEach((item) => (ludzie += `<@${item}>\n`));
	}

	return cfg.description + ludzie;
};

const removeUser = (user, list) => {
	const position = list.indexOf(user);
	if (position > -1){
		list.splice(position, 1);
		changed = true;
	}
};

const addUser = (user, listAdd, listRemove) => {
	
	removeUser(user, listRemove);

	if (listAdd.indexOf(user) == -1) {
		listAdd.push(user);
		changed = true;
	}
};

client.on('message', async (message) => {
	if (
		message.content.startsWith(cfg.prefix) &&
		message.content.endsWith(cfg.ping) &&
		ready
	) {
		ready = false;

		const embed = new Discord.MessageEmbed()
			.setTitle(
				'<:auselfreport:763026312117747782> Kto chętny na grę w **Among Us**? <:auselfreport:763026312117747782>',
			)
			.setColor(0xff0000)
			.setDescription(cfg.description)
			.setThumbnail('https://i.imgur.com/VdLgAxI.png');

		if (lista.length || listaafk.length) {
			msg.delete();
			embed.setDescription(createMessage(lista, listaafk));
		}

		// msg = await message.channel.send('<@&762726348057477180>', embed);
		msg = await message.channel.send(embed);

		cfg.reactions.map(async (reaction) => {
			const emoji = message.guild.emojis.cache.find(
				(emoji) => emoji.name === reaction,
			);
			await msg.react(emoji);
		});

		message.delete().catch(console.error);

		ready = true;

		const filter = (_reaction, user) => user.id !== msg.author.id;

		const collector = msg.createReactionCollector(filter);

		collector.on('collect', (reaction, user) => {
			
			changed = false;

			switch (reaction.emoji.name) {
				case 'auwhite':
					addUser(user.id, lista, listaafk);
					break;
				case 'aured':
					addUser(user.id, listaafk, lista);
					break;
				case 'aublackdead':
					removeUser(user.id, lista);
					removeUser(user.id, listaafk);
					break;
			}

			reaction.users.remove(user);

			embed.setDescription(createMessage(lista, listaafk));

			if (changed) {
				// msg.edit('<@&762726348057477180>', embed);
				msg.edit(embed);
			}
		});
	} else if (
		message.content.startsWith(cfg.prefix + 'ping') &&
		message.content.endsWith('end')
	) {
		message.delete().catch(console.error);

		if (lista.length || listaafk.length || typeof msg !== 'undefined') {
			msg.delete().catch(console.error);
			lista = [];
			listaafk = [];
		} else {
			const temp = await message.channel.send('Brak aktywnej listy 🤦‍♂️');
			temp.delete({ timeout: 5000 });
		}
	}
});

client.login(cfg.token);
