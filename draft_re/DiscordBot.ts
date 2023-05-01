import { AnyChannel, Client, Intents, Message, TextChannel, WebhookClient } from "discord.js";

class DiscordBot {
    private _backend: any;
    private _client: Client;
    public Prefix: string;

    public UpdatePresence(ActivityName: string) {
        let botUser = this._client.user;
        if (botUser) {
            botUser.setActivity(`${activityName} | Run ${this.Prefix}help | Made by cutymeo.`, {
                type: "WATCHING",
            });
        }
    }

    constructor(Backend, Prefix: string, BotToken: string) {
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

        this._client.login(BotToken);
        this.UpdatePresence("Pending");
    }
}

export = DiscordBot;