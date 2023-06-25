import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandIntegerOption } from "discord.js";
import { DiscordBot, DiscordBotCompatibilityLayer } from "../DiscordBot"

module.exports = {
	slashData: new SlashCommandBuilder()
		.setName('whitelist')
		.setDescription('Whitelist an asset.')
        .addIntegerOption((option: SlashCommandIntegerOption) => option.setName("asset_id").setDescription("The numeric ID of the asset needed to be whitelisted.")),
	async execute(Bot: DiscordBot, Interaction: ChatInputCommandInteraction<any> | Message<boolean>, Arguments: any[]) {
		const newLayer = new DiscordBotCompatibilityLayer(Interaction, true);
        await newLayer.init();
        if (Interaction instanceof ChatInputCommandInteraction)
            if (Arguments.length == 0)
                Arguments = [Interaction.options.getInteger('asset_id')]

        const RequestAssetId: number | undefined = Arguments[0] ? parseInt(Arguments[0]) : undefined;
        if (!RequestAssetId)
            return newLayer.reply("Asset ID must be a number.");

        const WhitelistOutput = await Bot.Backend.WhitelistAsset(RequestAssetId, NaN);
        if (WhitelistOutput.code == Bot.Backend.OutputCodes.OPERATION_SUCCESS) {
            const shareableId: number | undefined = WhitelistOutput.data ? WhitelistOutput.data["shareableId"] : undefined;
            await newLayer.reply(`Whitelisted successfully!${shareableId != undefined ? ` Your shareable ID is: \`\`${shareableId}\`\`` : ""}`);
        } else if (WhitelistOutput.code == Bot.Backend.OutputCodes.ALREADY_WHITELISTED)
            await newLayer.reply(`Already whitelisted. Use ${Bot.Prefix}getshareid to get the shareable ID.`);
        else
            await newLayer.reply(`Error while whitelisting!\nCode: ${Bot.Backend.LookupNameByOutputCode(WhitelistOutput.code)}${WhitelistOutput.message != undefined ? `\n${WhitelistOutput.message}` : ""}`)
        
        if (Interaction instanceof Message && Interaction.guild != null)
            newLayer.delete();
	},
};