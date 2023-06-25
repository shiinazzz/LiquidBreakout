import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import Backend from "./Backend";
import ServerFrontend from "./ServerFrontend";
import {DiscordBot} from "./DiscordBot";

if (fs.existsSync(path.resolve(__dirname, "../dev_config/.env"))) {
	dotenv.config({ path: path.resolve(__dirname, "../dev_config/.env") });
}

const RobloxToken: string | undefined = process.env["LBCookie"];
const RobloxAudioToken: string | undefined = process.env["AudioCookie"];
const BotToken: string | undefined = process.env["BotToken"];
const BotClientId: string | undefined = process.env["BotClientId"];
const MongoDBUri: string | undefined = process.env["MongoDBUri"];
const ServerType: string = process.env["ServerType"] || "WEAK";

const TheBackend = new Backend(RobloxToken, RobloxAudioToken, MongoDBUri, ServerType);
const Bot = new DiscordBot(TheBackend, ";", BotToken, BotClientId);
new ServerFrontend(TheBackend, Bot);
Bot.start();