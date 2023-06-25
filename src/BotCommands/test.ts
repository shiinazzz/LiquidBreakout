import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandIntegerOption } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
	slashData: new SlashCommandBuilder()
		.setName("test")
		.setDescription("Simple test command."),
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        newLayer.reply("I'm alive!");
	},
};