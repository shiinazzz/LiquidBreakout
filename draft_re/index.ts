import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import Backend from "./Backend";
import ServerFrontend from "./ServerFrontend";
import DiscordBot from "./DiscordBot";

if (fs.existsSync(path.resolve(__dirname, "../dev_config/.env"))) {
	dotenv.config({ path: path.resolve(__dirname, "../dev_config/.env") });
}

const RobloxToken: string | undefined = process.env["LBCookie"];
const BotToken: string | undefined = process.env["BotToken"];
const PrivilegeApiKey: string = process.env["PrivilegeApiKey"] || "LB_DEVTEST_PRIVILEGE_API_HOLDER_ABC_XYZ";

const WhitelistBackend = new Backend(RobloxToken, PrivilegeApiKey);
new ServerFrontend(WhitelistBackend);
new DiscordBot(WhitelistBackend, ";", BotToken);