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
						}" can't be loaded, please check and verify it has all required info.`
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
		return res;
	};
	stop = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
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
		return await player.setVolume(options.volume);
	};
	skip = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		return await player.stop();
	};
	pause = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		return await player.pause(true);
	};
	resume = async function (message) {
		if (!message) throw new SyntaxError("No message provided.");
		if (!message.member.voice.channel)
			throw new Error("Member not in voice channel.");
		const player = this.manager.players.get(message.guild.id);
		if (!player) throw new Error("There is no music playing.");
		return await player.pause(false);
	};
}

module.exports = RailwayMusicClient;
