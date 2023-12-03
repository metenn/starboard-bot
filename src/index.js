"use strict";

import Discord from "discord.js";
import { GatewayIntentBits, Partials } from "discord.js";
import config from "../botconfig.json" assert { type: "json" };
import { messageReactionHandler } from "./events/messageReactionHandler.js";
/**
 * @typedef {import("discord.js").TextBasedChannel} TextBasedChannel
 */

/**
 *  @type {Map<string, TextBasedChannel>}
 */
export const guildChannelMap = new Map();


const client = new Discord.Client({
    intents: GatewayIntentBits.Guilds
        | GatewayIntentBits.GuildMessages
        | GatewayIntentBits.GuildMessageReactions,
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.on("messageReactionAdd", (reactionEvent) => {
    messageReactionHandler(reactionEvent)
        .catch(e => console.error(e));
});

client.on("messageReactionRemove", (reactionEvent) => {
    messageReactionHandler(reactionEvent)
        .catch(e => console.error(e));
});

// we don't implement "messageReactionRemoveAll" and ""messageReactionRemoveEmoji" on purpose:
// more often than not these are accidental and delete a lot of history


async function startBot() {
    await client.login(config.token);
    console.log(`Logged in as ${client.user?.username}`);

    for (const [k, v] of Object.entries(config.starChannels)) {
        const tmpChannel = await client.channels.fetch(v);
        if (!(tmpChannel?.isTextBased())) {
            throw new Error("Channel is not text-based or doesn't exist");
        }
        guildChannelMap.set(k, tmpChannel);
    }

    console.log("Ready");
}

startBot();
