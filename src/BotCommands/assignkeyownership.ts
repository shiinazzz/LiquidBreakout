import { ChatInputCommandInteraction, Message } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
    requires: ["PRIVILEGE"],
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = []

        const SelectedApiKey: string | undefined = Arguments[0] || undefined;
        if (!SelectedApiKey)
            return newLayer.reply("An API key must be provided.");

        const AssignOwner: string | undefined = Arguments[1] || undefined;
        if (!AssignOwner)
            return newLayer.reply("A username must be provided.");

        const output = await Bot.Backend.SetApiKeyEntryValue("byKey", SelectedApiKey, "assignOwner", AssignOwner);
        if (output.code == Bot.Backend.OutputCodes.OPERATION_SUCCESS)
            newLayer.reply(`Successfully assigned \`\`${AssignOwner}\`\` to \`\`${SelectedApiKey}\`\``);
        else
            newLayer.reply(`Failed to assign, error: ${output.message}`);
	},
};