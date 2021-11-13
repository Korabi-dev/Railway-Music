/* eslint-disable indent */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable quotes */
"use strict";

const discord = require("discord.js");
const { Manager } = require("erela.js");

class RailwayMusicClient {
	constructor(options = {}) {
		const required = ["clientID", "clientToken", "defaultLogs"];
		required.map((option) => {
			if (!options[option]) throw new SyntaxError(`Missing option "${option}"`);
		});
		this.options = options;
		this.client = new discord.Client({
			intents: [discord.Intents.FLAGS.GUILD_VOICE_STATES]
		});
		this.nodes = [
			{
				host: "lava.darrennathanael.com",
				port: 80,
				password: "whatwasthelastingyousaid"
			},
			{ host: "lava.link", port: 80, password: "anything as password" }
		];
		if (options.nodes && Array.isArray(options.nodes)) {
			options.nodes.map((node) => {
				if (
					node.host &&
					typeof node.host === "string" &&
					node.port &&
					typeof node.port === "number" &&
					node.password &&
					typeof node.password === "string"
				) {
					this.nodes.push(node);
				} else {
					console.warn(
						`One of your nodes "${
							node.host ? node.host : "Unknown"
						}" can't be loaded, please check and verify it has all required info. Example of good node:\n{host: "korabi69.com", port: 80, password: "uwupower123"}`
					);
				}
			});
		}
		const nodes = this.nodes;
		this.manager = new Manager({
			nodes,
			send: (id, payload) => {
				const guild = this.client.guilds.cache.get(id);
				if (guild) guild.shard.send(payload);
			}
		});
		this.manager.on("nodeConnect", (node) => {
			if (options.defaultLogs) {
				console.log(`Node "${node.options.identifier}" connected.`);
			}
		});
		this.manager.on("nodeError", (node, error) => {
			if (options.defaultLogs) {
				console.log(
					`Node "${node.options.identifier}" encountered an error: ${error.message}.`
				);
			}
		});
		this.client.on("raw", (d) => this.manager.updateVoiceState(d));
		this.client.login(options.clientToken);
		this.manager.init(options.clientID);
	}
	embed = function (Title, Description, Footer) {
		const embed = new discord.MessageEmbed().setColor(
			this.options.autoReply.embedColor
				? this.options.autoReply.embedColor
				: "NOT_QUITE_BLACK"
		);
		if (Title) embed.setTitle(String(Title));
		if (Description) embed.setDescription(Description);
		if (Footer) embed.setFooter(String(Footer));
		return embed;
	};
	play = async function (options = {}) {
		if (!options.song || !options.message)
			throw new SyntaxError('Missing "message", "song", or all options.');
		if (!options.message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const search = options.song;
		let res;
		res = await this.manager.search(search, options.message.author);
		if (res.loadType === "LOAD_FAILED") throw res.exception;
		else if (res.loadType === "PLAYLIST_LOADED")
			throw { message: "Playlists are not supported." };
		if (res.loadType === "NO_MATCHES") throw new Error("No tracks found.");
		const player = this.manager.create({
			guild: options.message.guild.id,
			voiceChannel: options.message.member.voice.channel.id,
			textChannel: options.message.channel.id
		});
		player.connect();
		player.queue.add(res.tracks[0]);
		if (!player.playing && !player.paused && !player.queue.size) player.play();
		if (this.options.autoReply?.enabled) {
			await options.message.reply({
				embeds: [
					this.embed(
						this.options.autoReply.playTitle
							? this.options.autoReply.playTitle
							: "Song Found!",
						this.options.autoReply.playDescription
							? this.options.autoReply.playDescription
									.replace(/{title}/g, res.tracks[0].title)
									.replace(/{url}/g, res.tracks[0].uri)
									.replace(/{author}/g, res.tracks[0].author)
							: `Enqueueing **${res.tracks[0].title}**`
					)
				]
			});
		}
		return res;
	};
	stop = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		if (this.options.autoReply?.enabled) {
			await message.reply({
				embeds: [
					this.embed(
						this.options.autoReply.stopTitle
							? this.options.autoReply.stopTitle
							: "Ended Queue!",
						this.options.autoReply.stopDescription
							? this.options.autoReply.stopDescription
							: "I stopped playing music, and left the voice channel."
					)
				]
			});
		}
		return await player.destroy();
	};
	setVolume = async function (options = {}) {
		if (!options.volume || !options.message)
			throw new SyntaxError('Missing "message", "volume", or all options.');
		if (!options.message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(options.message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		if (isNaN(options.volume)) options.volume = 50;
		if (options.volume > 100) options.volume = 100;
		if (options.volume < 1) options.volume = 1;
		if (this.options.autoReply?.enabled) {
			await options.message.reply({
				embeds: [
					this.embed(
						this.options.autoReply.setVolumeTitle
							? this.options.autoReply.setVolumeTitle
							: "Volume Set",
						this.options.autoReply.setVolumeDescription
							? this.options.autoReply.setVolumeDescription.replace(
									/{volume}/g,
									String(options.volume)
							  )
							: `Set the volume to **${String(options.volume)}**.`
					)
				]
			});
		}
		return await player.setVolume(options.volume);
	};
	skip = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		if (this.options.autoReply?.enabled) {
			await message.reply({
				embeds: [
					this.embed(
						this.options.autoReply.skipTitle
							? this.options.autoReply.skipTitle
							: "Skipped Song!",
						this.options.autoReply.stopDescription
							? this.options.autoReply.skipDescription
							: "I have skipped the currently playing song."
					)
				]
			});
		}
		return await player.stop();
	};
	pause = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		if (this.options.autoReply?.enabled) {
			await message.reply({
				embeds: [
					this.embed(
						this.options.autoReply.pauseTitle
							? this.options.autoReply.pauseTitle
							: "Paused Song!",
						this.options.autoReply.pauseDescription
							? this.options.autoReply.pauseDescription
							: "I have paused the currently playing song."
					)
				]
			});
		}
		return await player.pause(true);
	};
	resume = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		if (this.options.autoReply?.enabled) {
			await message.reply({
				embeds: [
					this.embed(
						this.options.autoReply.resumeTitle
							? this.options.autoReply.resumeTitle
							: "Resumed Song!",
						this.options.autoReply.resumeDescription
							? this.options.autoReply.resumeDescription
							: "I have resumed the currently playing song."
					)
				]
			});
		}
		return await player.pause(false);
	};
	loopTrack = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		let res = "Started";
		if (player.trackRepeat == true) {
			await player.setTrackRepeat(false);
			res = "Stopped";
		} else {
			player.setTrackRepeat(true);
			res = "Started";
		}
		if (this.options.autoReply?.enabled) {
			 await message.reply({
				embeds: [
					this.embed(
						this.options.loopTrackTitle
							? this.options.loopTrackTitle
							: `${res} Loop.`,
						this.options.loopTrackDescription
							? this.options.loopTrackDescription
							: `${res} looping the currently playing song.`
					)
				]
			});
		}
		return player;
	};
	loopQueue = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		let res = "Started";
		if (player.queueRepeat == true) {
			await player.setQueueRepeat(false);
			res = "Stopped";
		} else {
			player.setQueueRepeat(true);
			res = "Started";
		}
		if (this.options.autoReply?.enabled) {
			 await message.reply({
				embeds: [
					this.embed(
						this.options.loopQueueTitle
							? this.options.loopQueueTitle
							: `${res} Loop.`,
						this.options.loopQueueDescription
							? this.options.loopQueueDescription
							: `${res} looping the current queue.`
					)
				]
			});
		}
		return player;
	};
}

module.exports = RailwayMusicClient;
