const Discord = require('discord.js');
const cfg = require('./config');

const client = new Discord.Client();

let listNow = [];
let listLater = [];
let msg;
let ready = true;
let changed = false;

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
	if (list.length || listAfk.length)
		ludzie += `\n*Łącznie osób:* **${list.length + listAfk.length}/10**\n`;
	if (list.length) {
		log(`Lista: ${list}`);
		ludzie += `\n*Osoby chętne do gry:*  **${list.length}/10** \n`;
		list.forEach((item) => (ludzie += `<@${item}>\n`));
	}
	if (listAfk.length) {
		log(`Lista AFK: ${listAfk}`);
		ludzie += `\n*Osoby chętne na później:*  **${listAfk.length}** \n`;
		listAfk.forEach((item) => (ludzie += `<@${item}>\n`));
	}

	return cfg.description + ludzie;
};

const removeUser = (user, list) => {
	const position = list.indexOf(user);
	if (position > -1) {
		log(`Removed user from list (${user})`);
		list.splice(position, 1);
		changed = true;
	}
};

const addUser = (user, listAdd, listRemove) => {
	removeUser(user, listRemove);

	if (listAdd.indexOf(user) == -1) {
		log(`Added new user to list (${user})`);
		listAdd.push(user);
		changed = true;
	}
};

client.once('ready', () => log(`Bot started & ready.`));

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

		if (listNow.length || listLater.length) {
			log('Refreshing ping message');
			msg.delete();
			embed.setDescription(createMessage(listNow, listLater));
		}

		// msg = await message.channel.send('<@&762726348057477180>', embed);
		msg = await message.channel.send(embed);

		cfg.reactions.map(async (reaction) => {
			const emoji = message.guild.emojis.cache.find(
				(emoji) => emoji.name === reaction,
			);
			log(`Added reaction (${emoji}) to message`);
			await msg.react(emoji);
		});

		message.delete().catch(console.error);

		ready = true;

		const filter = (_reaction, user) => user.id !== msg.author.id;

		const collector = msg.createReactionCollector(filter);

		collector.on('collect', (reaction, user) => {
			changed = false;

			log(`User: ${user} clicked reaction: ${reaction.emoji.name}`);

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
			}

			reaction.users.remove(user);

			embed.setDescription(createMessage(listNow, listLater));

			if (changed) {
				// msg.edit('<@&762726348057477180>', embed);
				msg.edit(embed);
				log(`Message changed, editing...`);
			}
		});
	} else if (
		message.content.startsWith(cfg.prefix + 'ping') &&
		message.content.endsWith('end')
	) {
		message.delete().catch(console.error);
		log(`Removing ping message...`);

		if (listNow.length || listLater.length || typeof msg !== 'undefined') {
			msg.delete().catch(console.error);
			listNow = [];
			listLater = [];
		} else {
			log(`No message found, omitting.`);
			const temp = await message.channel.send('Brak aktywnej listy 🤦‍♂️');
			temp.delete({ timeout: 5000 });
		}
	}
});

client.login(cfg.token);
log(`Logging in as: Among Ass`);
