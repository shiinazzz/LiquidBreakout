import { AnyChannel, Client, Intents, Message, TextChannel, WebhookClient } from "discord.js";
import Backend from "./Backend";

class DiscordBot {
    private _backend: Backend;
    private _client: Client;
    
    private privilegeUsers: string[] = ["915410908921077780", "849118831251030046"];
    private reverseShortPrivilegeUsers: string[] = ["915410908921077780", "849118831251030046", "324812431165751298"];

    public Prefix: string;

    public UpdatePresence(ActivityName: string) {
        let botUser = this._client.user;
        if (botUser) {
            botUser.setActivity(`Rewrite | ${ActivityName} | Run ${this.Prefix}help | Made by cutymeo.`, {
                type: "WATCHING",
            });
        }
    }

    public async OnMessage(Message: Message): Promise<any> {
        if (!Message || !Message.content.startsWith(this.Prefix))
            return;
        const Arguments: string[] = Message.content.slice(this.Prefix.length).trim().split(/ +/);
        let CommandName: string | undefined = Arguments.shift();
        if (!CommandName) return;
        CommandName = CommandName.toLowerCase();

        this.UpdatePresence(`Processing ${CommandName} for ${Message.author.tag}`);
    
        if (CommandName == "whitelist") {
            const RequestAssetId: number | undefined = Arguments[0] ? parseInt(Arguments[0]) : undefined;

            if (!RequestAssetId) {
                this.UpdatePresence("Pending.");
                return Message.reply("Asset ID must be a number.");
            }
            const WhitelistOutput = await this._backend.WhitelistAsset(RequestAssetId, NaN);
            this.UpdatePresence("Pending.");
            if (WhitelistOutput.code == this._backend.OutputCodes["WHITELIST_SUCCESS"]) {
                const shareableId: number | undefined = WhitelistOutput.data ? WhitelistOutput.data["shareableid"] : undefined;
                await Message.reply(`Whitelisted successfully!${shareableId != undefined ? `Your shareable ID is: ${shareableId}` : ""}`);
            } else if (WhitelistOutput.code == this._backend.OutputCodes["ALREADY_WHITELISTED"])
                await Message.reply(`Already whitelisted. Use ${this.Prefix}getshareid to get the shareable ID.`);
            else
                await Message.reply(`Error while whitelisting!\nCode: ${this._backend.LookupNameByOutputCode(WhitelistOutput.code)}${WhitelistOutput.message != undefined ? `\n${WhitelistOutput.message}` : ""}`)
            if (Message.guild != null)
                Message.delete();
        } else if (CommandName == "test") {
            this.UpdatePresence("Pending.");
            Message.reply("Hello! I'm alive!");
        } else if (CommandName == "forceShutdown") {
            if (this.privilegeUsers.indexOf(Message.author.id) == -1)
                return Message.reply("You cannot use this command!");
            this.UpdatePresence("Pending.");
            Message.reply("Force shutting down...");
            //exitHandler("FORCE");
        } else if (CommandName == "broadcast") {
            if (this.privilegeUsers.indexOf(Message.author.id) == -1) return Message.reply("You cannot use this command!");
            const BroadcastMessage: string = Arguments.join(" ");
            const BroadcastChannel: string = "1041032381668282450";
            Message.reply(`Broadcasting "${BroadcastMessage}"...`);

            const gotChannel: AnyChannel | undefined = this._client.channels.cache.get(BroadcastChannel);
            if (gotChannel) 
                (gotChannel as TextChannel).send(BroadcastMessage);

            this.UpdatePresence("Pending.");
        } else if (CommandName == "getshareid") {
            await Message.reply(`Your shareable ID is: \`\`${this._backend.IDConverter.Short(Arguments[0])}\`\``);
            if (Message.guild != null)
                Message.delete();

            this.UpdatePresence("Pending.");
        } else if (CommandName == "getnumberid") {
            if (this.reverseShortPrivilegeUsers.indexOf(Message.author.id) == -1)
                return Message.reply("You cannot use this command!");
            await Message.reply(`\`\`${Arguments[0]}\`\` converted to \`\`${this._backend.IDConverter.Number(Arguments[0])}\`\``);
            if (Message.guild != null)
                Message.delete();

            this.UpdatePresence("Pending.");
        } else if (CommandName == "setapikey") {
            if (this.privilegeUsers.indexOf(Message.author.id) == -1)
                return Message.reply("You cannot use this command!");

            this._backend.PrivilegeApiKey = Arguments[0];
            Message.reply(`Privilege API key has been set to '${Arguments[0]}'.`);
            this.UpdatePresence("Pending.");
        } else if (CommandName == "revokeapikey") {
            if (this.privilegeUsers.indexOf(Message.author.id) == -1)
                return Message.reply("You cannot use this command!");

            Message.reply("Privilege API key has been revoked.");
            this._backend.PrivilegeApiKey = "REVOKED";
            this.UpdatePresence("Pending.");
        } else if (CommandName == "help") {
            Message.reply(";help: This Message\n;whitelist [id]: Whitelist a map\n;getshareid [id]: Create a shareable ID (Short ID in FE2CM terms).");
            this.UpdatePresence("Pending.");
        }
    }

    constructor(Backend: any, Prefix: string, BotToken?: string) {
        if (BotToken == undefined)
            throw new Error("DiscordBot: No Bot Token was supplied.")
            
        this._backend = Backend;
        this._client = new Client({
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
        this.Prefix = Prefix

        this._client.on("ready", () => {
            console.log("DiscordBot: Ready for command");
            this.UpdatePresence("Pending");
        });
        this._client.on("messageCreate", (async (Message: Message): Promise<any> => this.OnMessage(Message)));

        this._client.login(BotToken);
        this.UpdatePresence("Pending");
        
        console.log("DiscordBot initialize");
    }
}

export default DiscordBot;