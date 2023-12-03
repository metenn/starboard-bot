"use strict";

import sqlite from "sqlite3";
import config from "../botconfig.json" assert { type: "json" };
/**
 * @typedef {import("discord.js").Snowflake} Snowflake
 * @typedef {import("./types.d.ts").StarMessageRow} StarMessageRow
 */

/**
 * @type {sqlite.Database}
 */
let db = await new Promise((resolve, reject) => {
    const handler = new sqlite.Database(config.sqliteDBPath, (err) => {
        if (err !== null) {
            reject();
        }
        resolve(handler);
    });
    setTimeout(reject, 1000);
});

/**
 * All available procedures for this database
 */
export const dbProcedures = {
    /**
     * @param {Snowflake} original_id 
     * @param {Snowflake} reposted_id 
     * @returns {Promise<void>}
     */
    newMessage: function (original_id, reposted_id) {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO star_message (original_id, reposted_id)
                VALUES (?, ?);`,
                [original_id, reposted_id],
                (err) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve();
                }
            );
            setTimeout(reject, 5000);
        });
    },
    /**
    * @param {Snowflake} original_id 
    * @returns {Promise<StarMessageRow | undefined>}
    */
    getMessages: function (original_id) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT CAST(original_id AS TEXT) AS original_id, CAST(reposted_id AS TEXT) AS reposted_id
                FROM star_message
                WHERE original_id = ?;`,
                original_id,
                (err, /** @type {StarMessageRow | undefined} */row) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve(row);
                }
            );
            setTimeout(reject, 5000);
        });
    },
    /**
     * @param {Snowflake} original_id 
     * @param {Snowflake} reposted_id 
     * @returns {Promise<void>}
     */
    updateRepost: function (original_id, reposted_id) {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE star_message
                SET reposted_id = ?
                WHERE original_id = ?;`,
                [reposted_id, original_id],
                (err) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve();
                }
            );
            setTimeout(reject, 5000);
        });
    },
    /**
    * @param {Snowflake} reposted_id 
    * @returns {Promise<void>}
    */
    deleteRepost: function (reposted_id) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE
                FROM star_message
                WHERE reposted_id = ?;`,
                reposted_id,
                (err) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve();
                }
            );
            setTimeout(reject, 5000);
        });
    }
};
