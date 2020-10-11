const Discord = require("discord.js");
const client = new Discord.Client();

const cfg = require("./config");

var lista = [];
var listaafk = [];
var msg;
var ready = true;

client.once("ready", () => {
	console.log("Ready!");
});

var description = `
<:aukill1:763025892414849055>   Jestem chętny!
<:klepsydra:764483594465968158>   Tak ale nie teraz...
<:aukill2:763025908554268682>   Wypisuję się ;(	

`;

client.on("message", async (message) => {
	if (
		message.content.startsWith(cfg.prefix) &&
		message.content.endsWith("ping") &&
		ready == true
	) {
		ready = false;

		var embed = new Discord.MessageEmbed()
			.setTitle(
				"<:auselfreport:763026312117747782> Kto chętny na grę w **Among Us**? <:auselfreport:763026312117747782>"
			)
			.setColor(0xff0000)
			.setDescription(description)
			.setThumbnail("https://i.imgur.com/VdLgAxI.png");

		if (lista.length > 0 || listaafk.length > 0) {
			msg.delete();
			ludzie = "";
			if (lista.length > 0) {
				console.log("Lista: " + lista);
				ludzie += `*Osoby chętne do gry:*  **${lista.length}/10** \n`;
				lista.forEach((item) => {
					ludzie += `<@${item}>\n`;
				});
			}
			if (listaafk.length > 0) {
				console.log("ListaAFK: " + listaafk);
				ludzie += `\n*Osoby chętne na później:*  **${listaafk.length}** \n`;
				listaafk.forEach((item) => {
					ludzie += `<@${item}>\n`;
				});
			}

			embed.setDescription(description + ludzie);
		}

		msg = await message.channel.send("<@&762726348057477180>", embed);

		for (let o in cfg.emojiname) {
			var n = [
				message.guild.emojis.cache.find(
					(event) => event.name == cfg.emojiname[o]
				),
			];
			for (let o in n) await msg.react(n[o]);
		}

		message.delete().catch(console.error);

		ready = true;

		const filter = (reaction, user) => {
			return user.id !== msg.author.id;
		};

		const collector = msg.createReactionCollector(filter);

		collector.on("collect", (r, u) => {
			//console.log(u.id + " clicked " + r.emoji.name);

			var changed = false;

			switch (r.emoji.name) {
				case "aukill1":
					var pos = lista.indexOf(u.id);
					var posafk = listaafk.indexOf(u.id);
					if (pos < 0) {
						lista.push(u.id);
						changed = true;
					}
					if (posafk >= 0) {
						listaafk.splice(posafk, 1);
						changed = true;
					}
					break;
				case "klepsydra":
					var pos = lista.indexOf(u.id);
					var posafk = listaafk.indexOf(u.id);
					if (pos >= 0) {
						lista.splice(pos, 1);
						changed = true;
					}
					if (posafk < 0) {
						listaafk.push(u.id);
						changed = true;
					}
					break;
				case "aukill2":
					var pos = lista.indexOf(u.id);
					var posafk = listaafk.indexOf(u.id);
					if (pos >= 0) {
						lista.splice(pos, 1);
						changed = true;
					}
					if (posafk >= 0) {
						listaafk.splice(posafk, 1);
						changed = true;
					}
					break;
				default:
					r.users.remove(u);
			}

			r.users.remove(u);

			ludzie = "";

			if (lista.length > 0) {
				ludzie += `*Osoby chętne do gry:*  **${lista.length}/10** \n`;
				lista.forEach((item) => {
					ludzie += `<@${item}>\n`;
				});
			}
			if (listaafk.length > 0) {
				ludzie += `\n*Osoby chętne na później:*  **${listaafk.length}** \n`;
				listaafk.forEach((item) => {
					ludzie += `<@${item}>\n`;
				});
			}

			embed.setDescription(description + ludzie);

			if (changed) msg.edit("<@&762726348057477180>", embed);

			//console.log(lista);
		});
	} else if (
		message.content.startsWith(cfg.prefix + "ping") &&
		message.content.endsWith("end")
	) {
		message.delete().catch(console.error);

		if (lista.length > 0 || listaafk.length > 0) {
			msg.delete().catch(console.error);
			lista = [];
			listaafk = [];
		} else {
			var temp = await message.channel.send("Co chcesz kończyć idioto??");
			temp.delete({ timeout: 5000 });
		}
	}
});

/*for (let o in emojiname)
            if (react.emoji.name == emojiname[o]) {
                let i = react.message.guild.roles.find(react => react.name == rolename[o]);
                event.message.guild.member(user).addRole(i).catch(console.error)
            }
});
*/
client.login(cfg.token);
