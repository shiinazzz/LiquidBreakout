import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import Backend = require("./Backend");
import ServerFrontend = require("./ServerFrontend");
import DiscordBot = require("./DiscordBot");

if (fs.existsSync(path.resolve(__dirname, "../dev_config/.env"))) {
	dotenv.config({ path: path.resolve(__dirname, "../dev_config/.env") });
}

const RobloxToken: string | undefined = process.env["LBCookie"];
const BotToken: string | undefined = process.env["BotToken"];
let PrivilegeApiKey: string = process.env["PrivilegeApiKey"] || "LB_DEVTEST_PRIVILEGE_API_HOLDER_ABC_XYZ";

const WhitelistBackend = new Backend(RobloxToken);
new ServerFrontend(WhitelistBackend);
new DiscordBot(WhitelistBackend, BotToken)