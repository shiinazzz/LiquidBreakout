import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandIntegerOption } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
    isTemplate: true,
	slashData: new SlashCommandBuilder()
		.setName("abc")
		.setDescription("abc"),
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = []
        if (Interaction instanceof Message && Interaction.guild != null)
            newLayer.delete();
	},
};