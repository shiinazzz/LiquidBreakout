import { ChatInputCommandInteraction, Message, Channel, TextChannel } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
    requires: ["PRIVILEGE"],
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = []

        const BroadcastMessage: string = Arguments.join(" ");
        const BroadcastChannel: string = "1041032381668282450";
        newLayer.reply(`Broadcasting "${BroadcastMessage}"...`);

        const gotChannel: Channel | undefined = this.Client.channels.cache.get(BroadcastChannel);
        if (gotChannel) 
            await (gotChannel as TextChannel).send(BroadcastMessage);
	},
};