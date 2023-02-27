/*
Liquid Breakout bot, in TypeScript.
First time using it lol.
*/

// TODO: Change to new commands structure (splited into files)

import { AnyChannel, Client, Intents, Message, TextChannel, WebhookClient } from "discord.js";
import fs from "fs";
import axios from "axios";
import http from "http";
import url from "url";
import { convertToNumber, convertToShort } from "./idConverter"

import path from "path";
import dotenv from "dotenv";

if (fs.existsSync(path.resolve(__dirname, "../dev_config/.env"))) {
	dotenv.config({ path: path.resolve(__dirname, "../dev_config/.env") });
}

let isDevUnit: boolean = false;
if (process.env["IsDevelopment"] == "1") {
	isDevUnit = true;
	print("Setting up development unit.")
}

const cookie: string | undefined = process.env["LBCookie"];
const token: string | undefined = process.env["BotToken"];
let privilegeApiKey: string = process.env["PrivilegeApiKey"] || "LB_DEVTEST_PRIVILEGE_API_HOLDER_ABC_XYZ";

const prefix: string = ";";
const outputShortId = true;
const defaultPresence: string = `${
	isDevUnit ? "<DEVELOPMENT UNIT> " : ""
}Pending.`;

const canWhitelist: boolean = true;
const whitelistBypass: string[] = ["915410908921077780", "849118831251030046"];
const hasPrivileges: string[] = ["915410908921077780", "849118831251030046"];
const hasReverseShortPrivileges: string[] = ["915410908921077780", "849118831251030046", "324812431165751298"];

const logWhitelistWebhookClient = new WebhookClient({
	url: "https://discord.com/api/webhooks/1060461349001502740/4-fS9MzRl-nMzJjQ1E0jXfyswtQt6pBM_o58EyZSJjB4vq-cu68blnINE7KmT-uJijJ9",
});

function print(message: string) {
	console.log(`LB Whitelist Bot: ${message}`);
}

function checkAssetOwnership(userId: string | number, assetId: string | number) {
	return new Promise((resolve, reject) => {
		axios(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}/is-owned`)
			.then((res) => {
				resolve(res.data);
			})
			.catch((_) => {
				resolve(false);
			});
	});
}

async function logWhitelist(
	message: Message | null,
	user: string,
	assetId: string | number,
	isSuccess: boolean,
	status: string,
) {
	if (isDevUnit == true) return;

	const thumbnailImage: string =
		message && user.search("<@") != -1
			? message.author.avatarURL() || ""
			: (await axios(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user}&size=150x150&format=Png&isCircular=false`)).data.data[0].imageUrl;
	let embeds: any = [
		{
			title: "New Whitelist Log",
			color: isSuccess ? 5763719 : 15548997,
			thumbnail: {
				url: thumbnailImage,
			},
			fields: [
				{
					name: "Discord User / Roblox UserID",
					value: String(user),
				},
				{
					name: "Asset",
					value: `https://roblox.com/library/${assetId}`,
				},
				{
					name: "Status",
					value: status,
				},
			],
		},
	];

	logWhitelistWebhookClient
		.send({
			embeds: embeds,
		})
		.then((_) => {})
		.catch((_) => {});
}

function whitelistAsset(userId: number | string, assetId: number | string): Promise<string> {
	return new Promise((resolve, reject) => {
		userId = parseInt(userId.toString());
		assetId = parseInt(assetId.toString());
		if (!isNaN(userId)) {
			checkAssetOwnership(userId, assetId)
				.then((res) => {
					if (res != true && res != "true") reject("You do not own this asset!");
				})
				.catch((_) => {
					reject("You do not own this asset!");
				});
		}
		axios({
			url: "https://auth.roblox.com/v1/logout",
			method: "POST",
			headers: {
				cookie: `.ROBLOSECURITY=${cookie}`,
			},
		}).catch((res) => {
			const xcsrf: string | undefined = res.response.headers["x-csrf-token"];
			if (!xcsrf) {
				return reject("Cannot get x-csrf-token.");
			}
			axios({
				url: `https://economy.roblox.com/v2/assets/${assetId}/details`,
				method: "GET",
			})
				.then(async (res) => {
					const ownedItem = await checkAssetOwnership(138801491, assetId);
					const productId = res.data.ProductId;
					const assetType = res.data.AssetTypeId;
					const isOnSale = res.data.IsPublicDomain;

					if (!isOnSale) reject("Item is not on-sale.");
					else if (assetType != 10) reject("Item is not a model.");
					else if (!isNaN(parseInt(res.data.PriceInRobux)) && parseInt(res.data.PriceInRobux) > 0)
						reject("Item is not free.");
					else if (!ownedItem) {
						axios({
							url: `https://economy.roblox.com/v1/purchases/products/${productId}`,
							method: "POST",
							headers: {
								cookie: `.ROBLOSECURITY=${cookie}`,
								"x-csrf-token": xcsrf,
							},
							data: {
								expectedCurrency: 1,
								expectedPrice: 0,
							},
						})
							.then((_) => {
								resolve(`Successfully whitelisted ${outputShortId ? `! Your shareable ID is: ${convertToShort(assetId.toString())}` : "ID!"}`);
								//resolve(`ID ${assetId} successfully whitelisted!`);
							})
							.catch((res) =>
								reject(
									`Failed to whitelist, error code: ${
										res.response != null
											? `${res.response.status}\nResponse: ${res.response.data}`
											: "Unknown. Token got changed?"
									}`,
								),
							);
					} else resolve(`ID is already whitelisted.${outputShortId ? ` Your shareable ID is: ${convertToShort(assetId.toString())}` : ""}`); //resolve(`${assetId} is already whitelisted.`);
				})
				.catch((res) => {
					reject(
						`Failed to fetch information. Error code: ${
							res.response != null
								? `${res.response.status}\nResponse: ${res.response.statusText}`
								: "Unknown."
						}\nMessage: ${
							res.data && res.data.errors ? res.data.errors[0].message : res.message ? res.message : res
						}`,
					);
				});
		});
	});
}

http.createServer(async function (req, res) {
	var parsedUrl = url.parse(req.url || "", true);
	var query = parsedUrl.query;
	let assetId: string = query.assetId ? query.assetId.toString() : "NULL";
	let userId: string = query.userId ? query.userId.toString() : "NULL";
	let apiKey: string = query.apiKey ? query.apiKey.toString() : "NULL";

	switch (parsedUrl.pathname) {
		case "/whitelist":
			if (!canWhitelist) {
				res.writeHead(400);
				res.end("Automatic whitelisting is disabled for the time being.");
				break;
			}
			if (assetId == "NULL" || isNaN(parseInt(assetId))) {
				res.writeHead(400);
				res.end("missing or invalid assetId in params");
				break;
			} else if (userId == "NULL" || isNaN(parseInt(userId))) {
				res.writeHead(400);
				res.end("missing or invalid userId in params");
				break;
			} else {
				try {
					const msg = await whitelistAsset(userId, assetId);
					res.writeHead(200);
					logWhitelist(null, userId, assetId, true, msg);
					res.end(msg);
				} catch (msg) {
					logWhitelist(null, userId, assetId, false, msg as string);
					res.writeHead(400);
					res.end(msg);
				}
				break;
			}
		case "/getnumberid":
			if (assetId == "NULL") {
				res.writeHead(400);
				res.end("missing or invalid assetId in params");
				break;
			} else if (apiKey == "NULL" || apiKey != privilegeApiKey) {
				res.writeHead(400);
				res.end("missing or invalid apiKey in params");
				break;
			} else {
				res.writeHead(200);
				res.end(convertToNumber(assetId));
				break;
			}
		default:
			res.writeHead(200);
			res.end("bot for lb, it do whitelist stuff which is cool and all");
	}
}).listen(8080);
new http.Agent({
	keepAlive: true,
	maxSockets: 1,
	keepAliveMsecs: 15000,
});

const BotClient: Client = new Client({
	partials: ["CHANNEL"],
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MESSAGE_TYPING,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGE_TYPING,
	],
});

function exitHandler(signal: string) {
	print(`Received ${signal}, terminating.`);
	BotClient.destroy();
	if (!isDevUnit)
		process.exit();
}

function updatePresence(activityName: string) {
	let botUser = BotClient.user;
	if (botUser) {
		print(`Updating presence to ${activityName}`);
		botUser.setActivity(`${activityName} | Run ${prefix}help | Made by cutymeo.`, {
			type: "WATCHING",
			//url: "https://www.twitch.tv/monstercat",
		});
	}
}

BotClient.on("ready", () => {
	print("Active.");
	updatePresence(defaultPresence);
});

BotClient.on("messageCreate", async (message: Message): Promise<any> => {
	if (message && message.content.startsWith(prefix)) {
		const args: string[] = message.content.slice(prefix.length).trim().split(/ +/);
		let commandName: string | undefined = args.shift();
		if (!commandName) return;
		commandName = commandName.toLowerCase();

		updatePresence(`Processing ${commandName} for ${message.author.tag}`);

		if (commandName == "whitelist") {
			if (!canWhitelist && whitelistBypass.indexOf(message.author.id) == -1) {
				print(`${commandName} failed for ${message.author.id}: Whitelist is disabled for user`);
				updatePresence(defaultPresence);
				return message.reply(`Cannot whitelist: Automatic whitelisting is disabled for the time being.`);
			}
			if (!process.env["AWS_REGION"] || process.env["AWS_REGION"].search("ap") == -1) {
				print(`${commandName} failed for ${message.author.id}: Bot in incorrect region`);
				updatePresence(defaultPresence);
				return message.reply(
					`Bot is in incorrect region. Please notify the bot developer to reboot. Until then, you cannot whitelist.`,
				);
			}
			if (args[0] && !isNaN(parseInt(args[0]))) {
				// Will now attempt to automatically whitelist
				print(`${commandName} begin processing for ${message.author.id}`);
				whitelistAsset(NaN, args[0])
					.then(async (msg) => {
						logWhitelist(message, `<@${message.author.id}>`, args[0], true, msg);
						print(`${commandName} finished for ${message.author.id} message = ${msg}, ID = ${args[0]}`);
						await message.reply(msg);
						updatePresence(defaultPresence);
						message.delete();
					})
					.catch(async (msg) => {
						logWhitelist(message, `<@${message.author.id}>`, args[0], false, msg);
						print(`${commandName} failed for ${message.author.id} message = ${msg}, ID = ${args[0]}`);
						await message.reply(msg);
						updatePresence(defaultPresence);
						message.delete();
					});
			} else {
				updatePresence(defaultPresence);
				message.reply("Either there's no argument or it's not a number!");
			}
		} else if (commandName == "test") {
			updatePresence(defaultPresence);
			message.reply("Hello! I'm alive!");
		} else if (commandName == "forceShutdown") {
			if (hasPrivileges.indexOf(message.author.id) == -1) return message.reply("You cannot use this command!");
			message.reply("Force shutting down...");
			updatePresence(defaultPresence);
			exitHandler("FORCE");
		} else if (commandName == "broadcast") {
			if (hasPrivileges.indexOf(message.author.id) == -1) return message.reply("You cannot use this command!");
			const broadcastMessage: string = args.join(" ");
			const broadcastChannel: string = "1041032381668282450";
			message.reply(`Broadcasting "${broadcastMessage}"...`);

			const gotChannel: AnyChannel | undefined = BotClient.channels.cache.get(broadcastChannel);
			if (gotChannel) (gotChannel as TextChannel).send(broadcastMessage);
			updatePresence(defaultPresence);
		} else if (commandName == "getnumberid") {
			if (hasReverseShortPrivileges.indexOf(message.author.id) == -1) return message.reply("You cannot use this command!");
			message.reply(`\`\`${args[0]}\`\` converted to \`\`${convertToNumber(args[0])}\`\``);
		} else if (commandName == "setapikey") {
			if (hasPrivileges.indexOf(message.author.id) == -1) return message.reply("You cannot use this command!");
			privilegeApiKey = args[0];
			message.reply(`Privilege API key has been set to '${args[0]}'.`);
		} else if (commandName == "revokeapikey") {
			if (hasPrivileges.indexOf(message.author.id) == -1) return message.reply("You cannot use this command!");
			message.reply("Privilege API key has been revoked.");
			privilegeApiKey = "REVOKED";
		} else if (commandName == "help") {
			message.reply(";help: This message\n;whitelist [id]: Whitelist a map\n;replaygameplay: ????")
		}
	}
});

// Setup
process.on("SIGINT", exitHandler);
process.on("SIGTERM", exitHandler);

// Login
BotClient.login(token);