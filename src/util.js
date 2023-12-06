"use strict";

import config from "../botconfig.json" assert { type: "json" };
/**
 * @typedef {import("discord.js").Message} Message
 */

/**
 * Makes `throw` an expression, useful for null coalescing operator
 * @param {any} [errorMessage]
 * @throws {Error}
 * @returns {never}
 */
export function throwExpression(errorMessage) {
    throw new Error(errorMessage);
}

/**
 * Formats the message to be sent to the starboard channel, taking into account
 * the 2000 char limit.
 *
 * In building the string, the function will prioritise printing the top text
 * (Star count, original message), next all attachment URLs and lastly the
 * (quoted) message
 * @param {number} reactCount
 * @param {Message} message
 */
export function formatStarMessage(reactCount, message) {
    let returnText = `${(reactCount >= config.minReactionCount * 2) ? "\u{1F31F}" : "\u2B50"} **${reactCount}** `;
    returnText += `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}\n`;
    let urlsText = "";
    for (const attachment of message.attachments.values()) {
        let txtUrl = attachment.url;
        // Strip Discord's new URL search params
        const tmpUrl = new URL(attachment.url);
        if (tmpUrl.hostname === "cdn.discordapp.com" || tmpUrl.hostname === "media.discordapp.net") {
            tmpUrl.searchParams.delete("ex");
            tmpUrl.searchParams.delete("is");
            tmpUrl.searchParams.delete("hm");
            txtUrl = tmpUrl.toString();
        }
        urlsText += txtUrl + "\n";
    }
    const maxLength = Math.max(Math.min(1999, 1999 - urlsText.length - returnText.length), 0);
    let messageContent = message.content;
    if (messageContent.length > 0) {
        messageContent = "> " + messageContent;
    }
    returnText += messageContent.replaceAll("\n", "\n> ").substring(0, maxLength);
    returnText += "\n";
    returnText += urlsText;
    return returnText.substring(0, 2000);
}
