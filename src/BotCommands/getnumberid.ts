import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
    requires: ["PRIVILEGE", "REVERSE_SHORT"],
	slashData: new SlashCommandBuilder()
		.setName("getnumberid")
		.setDescription("Retrive the numeric ID representation of a shareable ID.")
        .addStringOption((option: SlashCommandStringOption) => option.setName("id").setDescription("The numeric ID to be converted.")),
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = [Interaction.options.getString("id")]

        const RequestId: string | undefined = Arguments[0];
        if (!RequestId)
            return newLayer.reply("ID must be a string.");

        await newLayer.reply(`Your numeric ID is: \`\`${Bot.Backend.IDConverter.Number(RequestId.toString())}\`\``);
        if (Interaction instanceof Message && Interaction.guild != null)
            newLayer.delete();
	},
};