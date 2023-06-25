import { ChatInputCommandInteraction, Message } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = []

        const SearchValue: string | undefined = Arguments[0] || undefined;
        if (!SearchValue)
            return newLayer.reply("A search string must be provided.");

        const documents = await Bot.Backend.GetApiKeysFromUser(SearchValue);
        var keys: any[] = [];
        documents.forEach(async (document) => keys.push(`\`\`${document.value}\`\``));

        if (keys.length > 0)
            newLayer.reply(`Found ${keys.length} key(s): ${keys.join(", ")}`);
        else
            newLayer.reply("No keys found.")
	},
};