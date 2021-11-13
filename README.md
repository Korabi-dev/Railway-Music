## Railway-Music:

Railway-Music is an npm package designed to not break [railway](https://railway.app/)'s Terms of Serivce, but still let you play music.

This package was made because lot of people were having trouble with hosting their music bots on [railway](https://railway.app/).

## About the package:

Railway-Music uses Erela.js and Lavalink in a combination that does not download any DMCA protected content, therefor being in compliance with [railway](https://railway.app/)'s Terms of Serivce, You can check out the [Erela.js docs](https://guides.menudocs.org/topics/erelajs/) for more info on MusicClient.manager and Events. Note: Where ever Erela.js Docs say "client" that will translate to "MusicClient" if you are using the examples provided below.

## Install:

```shell
npm install railway-music
```

or

```shell
yarn add railway-music
```

## Music Bot Example:

```js
const RailwayMusic = require("railway-music");
const MusicClient = new RailwayMusic({
  clientID: "ID",
  clientToken: "TOKEN",
  defaultLogs: true,
});
const discord = require("discord.js");
const client = new discord.Client({ intents: 32767 });
client.login("TOKEN");

// Log it when the client is ready.
client.on("ready", () => {
  console.log("Logged in.");
});

// Play command
client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.toLowerCase().startsWith("!play")) return;
  try {
    const response = await MusicClient.play({
      message: m,
      song: m.content.replace("!play", "").trim(),
    });
    return m.reply({
      embeds: [
        new discord.MessageEmbed()
          .setTitle("Enqueueing")
          .setDescription(
            `Enqueueing: **${response.tracks[0].title}**, requested by \`${response.tracks[0].requester.tag}\` `
          ),
      ],
    });
  } catch (e) {
    return m.reply({
      embeds: [
        new discord.MessageEmbed().setTitle("Error").setDescription(String(e)),
      ],
    });
  }
});

// Stop | Leave command
client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.toLowerCase().startsWith("!stop")) return;
  try {
    await MusicClient.stop(m);
    return m.reply({
      embeds: [
        new discord.MessageEmbed()
          .setTitle("Deleted Queue")
          .setDescription("Deleted the queue and exited the voice channel."),
      ],
    });
  } catch (e) {
    return m.reply({
      embeds: [
        new discord.MessageEmbed().setTitle("Error").setDescription(String(e)),
      ],
    });
  }
});

// Skip command
client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.toLowerCase().startsWith("!skip")) return;
  try {
    await MusicClient.skip(m);
  } catch (e) {
    return m.reply({
      embeds: [
        new discord.MessageEmbed().setTitle("Error").setDescription(String(e)),
      ],
    });
  }
});

// Pause command
client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.toLowerCase().startsWith("!pause")) return;
  try {
    await MusicClient.pause(m);
    return m.reply({
      embeds: [
        new discord.MessageEmbed()
          .setTitle("Paused")
          .setDescription("Paused the current song."),
      ],
    });
  } catch (e) {
    return m.reply({
      embeds: [
        new discord.MessageEmbed().setTitle("Error").setDescription(String(e)),
      ],
    });
  }
});

// Resume command
client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.toLowerCase().startsWith("!resume")) return;
  try {
    await MusicClient.resume(m);
    return m.reply({
      embeds: [
        new discord.MessageEmbed()
          .setTitle("Resumed")
          .setDescription("Resumed the current song."),
      ],
    });
  } catch (e) {
    return m.reply({
      embeds: [
        new discord.MessageEmbed().setTitle("Error").setDescription(String(e)),
      ],
    });
  }
});

// Volume command
client.on("messageCreate", async (m) => {
  if (m.author.bot || !m.content.toLowerCase().startsWith("!volume")) return;
  try {
    await MusicClient.setVolume({
      message: m,
      volume: Number(m.content.replace("!volume", "").replace(/ /g, "").trim()),
    });
    return m.reply({
      embeds: [
        new discord.MessageEmbed()
          .setTitle("Volume set")
          .setDescription(
            `Set volume to: ${m.content
              .replace("!volume", "")
              .replace(/ /g, "")
              .trim()}`
          ),
      ],
    });
  } catch (e) {
    return m.reply({
      embeds: [
        new discord.MessageEmbed().setTitle("Error").setDescription(String(e)),
      ],
    });
  }
});

// Send a message to the channel when there is no more music left to play, and leave the voice channel.
MusicClient.manager.on("queueEnd", (player) => {
  const embed = new discord.MessageEmbed()
    .setTitle("Queue Ended")
    .setDescription(
      "There is no more songs to play! I have to leave the channel friends :("
    );

  client.channels.cache.get(player.textChannel).send({ embeds: [embed] });
  player.destroy();
});

// Send a message when a song starts playing
MusicClient.manager.on("trackStart", (player, track) => {
  const embed = new discord.MessageEmbed()
    .setTitle("Music Playing")
    .setDescription(
      `Now playing: **${track.title}**, requested by \`${track.requester.tag}\`.`
    );
  client.channels.cache.get(player.textChannel).send({ embeds: [embed] });
});
```

- Apologies on the unorganized commands, but I wanted to have it be simple.

## Documentation:

- Note:<br>
  If a property has "?" at the end of its name, it means said property is optional.

## MusicClient Constructor

```js
new RailwayMusic(MusicClientOptions);
```

- MusicClientOptions:<br><h5>Type: `Object`</h5><h5>Properties: {nodes?: `Array<{host: String, port: Number, password: String}>`, autoReply?: `Object<{enabled: Boolean, funtionNameTitle?: String, functionNameDescription?: String, embedColor: DiscordJsColorResolvable}>`, defaultLogs: `Boolean`, clientID: `String`, clientToken: `String`}</h5><h5>Required: Yes</h5>

- Notes:<br>
<h5>You can put "{author}", "{title}", or "{url}" in `MusicClientOptions.autoReply.playDescription`, and "{volume}" in `MusicClientOptions.autoReply.setVolumeDescription`, It will be replace with the appropriate info.</h5>
<h5>Do not literally type out "functionNameTitle" or "functionNameDescription" instead you have to replace "functionName" with a valid function name, say you wanted to skip a song; You would want to set the "skipTitle" and "skipDescription" values.</h5>

## Play Function

```js
MusicClient.play(PlayOptions);
```

- PlayOptions:<br><h5>Type: `Object`</h5><h5>Properties: {message: `Discord.js Message Object`, song: `String`}</h5><h5>Required: Yes</h5>

## Stop Function

```js
MusicClient.stop(Message);
```

- Message:<br><h5>Type: `Discord.js Message Object`</h5><h5>Required: Yes</h5>

## SetVolume Function

```js
MusicClient.setVolume(VolumeOptions);
```

- VolumeOptions:<br><h5>Type: `Object`</h5><h5>Properties: {message: `Discord.js Message Object`, volume: `Number`}</h5><h5>Required: Yes</h5>

## Stop Function

```js
MusicClient.skip(Message);
```

- Message:<br><h5>Type: `Discord.js Message Object`</h5><h5>Required: Yes</h5>

## Pause Function

```js
MusicClient.pause(Message);
```

- Message:<br><h5>Type: `Discord.js Message Object`</h5><h5>Required: Yes</h5>

## Resume Function

```js
MusicClient.resume(Message);
```

- Message:<br><h5>Type: `Discord.js Message Object`</h5><h5>Required: Yes</h5>


## LoopTrack Function

```js
MusicClient.loopTrack(Message);
```

- Message:<br><h5>Type: `Discord.js Message Object`</h5><h5>Required: Yes</h5>

## LoopQueue Function

```js
MusicClient.loopQueue(Message);
```

- Message:<br><h5>Type: `Discord.js Message Object`</h5><h5>Required: Yes</h5>

* If you have any questions about this package join the [official railway discord server](discord.gg/railway) and ping me (Korabi <3#6251) in the chat.