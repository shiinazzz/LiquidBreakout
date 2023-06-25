import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandIntegerOption } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
	slashData: new SlashCommandBuilder()
		.setName("getshareid")
		.setDescription("Retrive the shareable ID of an numeric ID.")
        .addIntegerOption((option: SlashCommandIntegerOption) => option.setName("id").setDescription("The numeric ID to be converted.")),
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = [Interaction.options.getInteger("id")]

        const RequestId: number | undefined = Arguments[0] ? parseInt(Arguments[0]) : undefined;
        if (!RequestId)
            return newLayer.reply("ID must be a number.");

        await newLayer.reply(`Your shareable ID is: \`\`${Bot.Backend.IDConverter.Short(RequestId.toString())}\`\``);
        if (Interaction instanceof Message && Interaction.guild != null)
            newLayer.delete();
	},
};