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

        const ToggleValue: string | undefined = Arguments[1] || undefined;
        if (!ToggleValue || (ToggleValue != "false" && ToggleValue != "true"))
            return newLayer.reply("Toggle value must be either true or false.");

        const trueToggle = ToggleValue == "true" ? true : false;
        const output = await Bot.Backend.SetApiKeyEntryValue("byKey", SelectedApiKey, "enabled", trueToggle);
        if (output.code == Bot.Backend.OutputCodes.OPERATION_SUCCESS)
            newLayer.reply(`Successfully toggled \`\`${SelectedApiKey}\`\` enabled value to \`\`${ToggleValue}\`\``);
        else
            newLayer.reply(`Failed to toggle, error: ${output.message}`);
	},
};