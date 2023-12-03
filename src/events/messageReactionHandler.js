"use strict";

import config from "../../botconfig.json" assert { type: "json" };
import { DiscordAPIError } from "discord.js";
import { formatStarMessage } from "../util.js";
import { dbProcedures } from "../dbManager.js";
import { guildChannelMap } from "../index.js";
/**
 * @typedef {import("discord.js").MessageReaction} MessageReaction
 * @typedef {import("discord.js").PartialMessageReaction} PartialMessageReaction
 */

/**
 * Handles a messageReaction event, and either posts, updates or deletes a message from the starboard channel.
 * @param {MessageReaction | PartialMessageReaction} reactionEvent 
 * @returns {Promise<void>}
 */
export async function messageReactionHandler(reactionEvent) {
    // Early exit if it's not the emote we're checking for.
    if (reactionEvent.emoji.id !== null || reactionEvent.emoji.name !== "\u2B50") {
        return;
    }
    // Early exit if we're not in a guild where a starboard channel is registered.
    const starChannel = guildChannelMap.get(reactionEvent.message.guildId ?? "");
    if (starChannel === undefined) {
        return;
    }
    // When re-reacting to a recently edited message, checking for partial on `reaction` returns false.
    // But then message.reaction (of which .partial is also false) has no attachment or content info.
    // So we just don't check for partials and hope the magical fetch cache thing at least saves me from a network request...
    // (It doesn't.)
    // Free extra network request!
    const [reaction, reactionMessage, dbResponse] = await Promise.all([reactionEvent.fetch(), reactionEvent.message.fetch(), dbProcedures.getMessages(reactionEvent.message.id)]);
    // Early exit if the author is the bot itself or if it's a reaction in the starboard channel.
    if (reactionMessage.channel.id === starChannel.id || reactionMessage.author.id === reaction.client.application?.id) {
        return;
    }
    if (reaction.count >= config.minReactionCount) {
        // Only edit message with newer, lower number of reactions (or repost if it somehow doesn't exist).
        if (dbResponse === undefined) {
            const newRepostMsg = await starChannel.send(formatStarMessage(reaction.count, reactionMessage));
            await dbProcedures.newMessage(reactionMessage.id, newRepostMsg.id);
        } else {
            try {
                await starChannel.messages.edit(dbResponse.reposted_id, formatStarMessage(reaction.count, reactionMessage));
            } catch (e) {
                if (e instanceof DiscordAPIError && e.code === 10008) {
                    // Most likely, message was removed from starboard. We repost it and save it to the DB.
                    console.error("Message deleted from starboard or invalid DB record");
                    const newRepostMsg = await starChannel.send(formatStarMessage(reaction.count, reactionMessage));
                    await dbProcedures.updateRepost(reactionMessage.id, newRepostMsg.id);
                } else {
                    throw e;
                }
            }
        }
    } else {
        // Message is known to be in starboard?
        if (dbResponse === undefined) {
            return;
        }
        // If yes, try to delete.
        try {
            await starChannel.messages.delete(dbResponse.reposted_id);
        } catch (e) {
            if (e instanceof DiscordAPIError && e.code === 10008) {
                console.error("Message already not present in channel");
            } else {
                throw e;
            }
        }
        await dbProcedures.deleteRepost(dbResponse.reposted_id);
    }
}