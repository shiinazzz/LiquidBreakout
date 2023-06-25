import { ActivityType, ChatInputCommandInteraction, Client, Collection, Events, GatewayIntentBits, Interaction, Message, Partials, REST, Routes, WebhookClient } from "discord.js";
import Backend from "./Backend";
import fs from "fs"
import path from "path"

class DiscordBot {
    private _token: string;
    private _clientId: string;
    
    private privilegeUsers: string[] = ["915410908921077780", "849118831251030046"];
    private reverseShortPrivilegeUsers: string[] = ["915410908921077780", "849118831251030046", "324812431165751298"];
    private _commands: Collection<string, any>;
    private _commandsData: any[];

    public Backend: Backend;
    public Client: Client;
    public Alive: boolean;
    public Prefix: string;

    public UpdatePresence(ActivityName: string) {
        let botUser = this.Client.user;
        if (botUser) {
            botUser.setActivity(`${ActivityName} | Made by shiinazzz (cutymeo).`, {
                type: ActivityType.Watching,
            });
        }
    }

    private _checkUserPermissions(userId: string, permsArray?: string[]) {
        if (!permsArray)
            return true;

        let havePermission = undefined;
        if (!havePermission && permsArray.indexOf("PRIVILEGE") != -1)
            havePermission = this.privilegeUsers.indexOf(userId) != 1;
        if (!havePermission && permsArray.indexOf("REVERSE_SHORT") != -1)
            havePermission = this.reverseShortPrivilegeUsers.indexOf(userId) != 1;
        return havePermission == undefined || havePermission == true;
    }

    public async OnMessage(Message: Message): Promise<any> {
        if (!Message || !Message.content.startsWith(this.Prefix) || !this.Alive)
            return;

        const Arguments: string[] = Message.content.slice(this.Prefix.length).trim().split(/ +/);
        let CommandName: string | undefined = Arguments.shift();
        if (!CommandName) return;
        CommandName = CommandName.toLowerCase();

        this.UpdatePresence(`Processing ${CommandName} for ${Message.author.tag}`);
        const command = this._commands.get(CommandName);
        if (command) {
            if (!this._checkUserPermissions(Message.author.id, command.requires)) {
                return new DiscordBotCompatibilityLayer(Message, false).reply(`You do not have permission to run this command!\nCommand permission: [${command.requires.join(", ")}]`);
            }
            try {
                await command.execute(this, Message, Arguments);
            } catch (err) {
                new DiscordBotCompatibilityLayer(Message, false).reply(`Failed to complete command, error: ${err}`);
            }
        }
        this.UpdatePresence("Pending.");
    }

    public async OnInteraction(Interaction: Interaction<any>): Promise<any> {
        if (!Interaction.isChatInputCommand()) return;
        
        this.UpdatePresence(`Processing ${Interaction.commandName} for ${Interaction.user.tag}`);
        const command = this._commands.get(Interaction.commandName);
        if (command && command.slashData) {
            if (!this._checkUserPermissions(Interaction.user.id, command.requires)) {
                return new DiscordBotCompatibilityLayer(Interaction, false).reply(`You do not have permission to run this command!\nCommand permission: [${command.requires.join(", ")}]`);
            }
            try {
                await command.execute(this, Interaction, []);
            } catch (err) {
                new DiscordBotCompatibilityLayer(Interaction, false).reply(`Failed to complete command, error: ${err}`);
            }
        }
        this.UpdatePresence("Pending.");
    }

    public async start() {
        // Registering commands
        const botRest = new REST().setToken(this._token);
        const data: any = await botRest.put(
			Routes.applicationCommands(this._clientId),
			{ body: this._commandsData },
		);

		console.log(`DiscordBot: Successfully registered ${data.length} slash commands.`);

        // Register events
        this.Client.on(Events.ClientReady, () => {
            this.Alive = true;
            console.log("DiscordBot: Ready for command");
            this.UpdatePresence("Pending");
        });
        this.Client.on(Events.MessageCreate, (async (Message: Message): Promise<any> => this.OnMessage(Message)));
        this.Client.on(Events.InteractionCreate, async (Interaction: Interaction<any>) => this.OnInteraction(Interaction));
        
        // Login
        this.Client.login(this._token);
        this.UpdatePresence("Pending");

        console.log("DiscordBot: Login success, bot ready");
    }

    constructor(Backend: any, Prefix: string, BotToken?: string, ClientId?: string) {
        if (BotToken == undefined)
            throw new Error("DiscordBot: No Bot Token was supplied.")
        if (ClientId == undefined)
            throw new Error("DiscordBot: No Client ID was supplied.")
            
        this.Backend = Backend;
        this.Client = new Client({
            partials: [Partials.Channel],
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.MessageContent
            ],
        });
        this._token = BotToken;
        this._clientId = ClientId;
        this.Prefix = Prefix
        this.Alive = false;

        // Load the commands
        this._commands = new Collection();
        this._commandsData = [];
        const commandsPath = path.join(__dirname, 'BotCommands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if (command.isTemplate)
                continue;
            if (command.execute) {
                const commandName: string = command.slashData ? command.slashData.name : path.parse(file).name;
                this._commands.set(commandName, command);
                if (command.slashData)
                    this._commandsData.push(command.slashData.toJSON());

                console.log(`DiscordBot: Loaded command file ${file} with name: ${commandName}`)
            } else {
                console.log(`DiscordBot: Cannot load command file ${file} as it's missing data.`)
            }
        }
        
        console.log("DiscordBot initialize");
    }
}

class DiscordBotCompatibilityLayer {
    private _object: Message<boolean> | ChatInputCommandInteraction<any>;
    private _defer: boolean;

    public async send() {
        return;
    }

    public async reply(options: any) {
        if (this._object instanceof Message)
            return await this._object.reply(options);
        else if (this._object instanceof ChatInputCommandInteraction) {
            if (this._object.deferred)
                if (this._object.replied)
                    return await this._object.followUp(options);
                else
                    return await this._object.editReply(options);
            else
                return await this._object.reply(options);
        }
    }

    public async delete() {
        if (this._object instanceof Message)
            return await this._object.delete();
        return;
    }

    public async init(ephemeral?: boolean) {
        if (this._defer && this._object instanceof ChatInputCommandInteraction)
            await this._object.deferReply({ ephemeral: ephemeral ? ephemeral : true });
    }

    constructor(InteractionObject: Message<boolean> | ChatInputCommandInteraction<any>, doDefer: boolean) {
        this._object = InteractionObject;
        this._defer = doDefer;
    }
}

export {DiscordBot, DiscordBotCompatibilityLayer};