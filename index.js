/*
cutymeo here, finally made a new bot in 2022.
Structure is probably better than old epic bot.
Though do not use a folder yet.
*/
const { Client, Intents } = require('discord.js');
const axios = require('axios');

const cookie = process.env.LBCookie;
const prefix = ";";

const canWhitelist = false;
const whitelistBypass = [915410908921077780, 849118831251030046];

function ExtractStringByBrackets(document, leftBracket, rightBracket, maxLength) // Extracted from Hosted UnlockedInsertService.
{
  document = String(document);
  var indice1 = document.indexOf(leftBracket);
  var indice2 = indice1 + leftBracket.length;
  var indice3 = document.indexOf(rightBracket, indice2);
  if (indice1 == -1 || indice3 == -1 || indice3 - indice2 > maxLength)
    throw "Cannot find the bracketed string.";
  return document.substr(indice2, indice3 - indice2);
}

module.exports = {
  connect: function(TOKEN) {
    const BotClient = new Client({ partials: ["CHANNEL"], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING] });
    
    BotClient.once('ready', () => {
      console.log('LB Whitelist Bot: Active.')
      BotClient.user.setPresence({
        status: 'online',
        activities: [{
          name: `Prefix: ${prefix} | Waiting for whitelisting. Made by cutymeo!`,
          type: 'PLAYING',
          url: 'https://www.twitch.tv/monstercat'
        }]
      })
    });

    BotClient.on('messageCreate', async (message) => {
      if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (commandName == "whitelist") {
					if (!canWhitelist && whitelistBypass.indexOf(message.authod.id) == -1) return message.reply(`Cannot whitelist: Automatic whitelisting is disabled for the time being.`);
					if (!process.env.AWS_REGION || process.env.AWS_REGION.search("us") == -1) return message.reply(`Bot is in incorrect region. Please notify the bot developer to reboot. Until then, you cannot whitelist.`);
          if (args[0] && parseInt(args[0]) != NaN) {
            // Will now attempt to automatically whitelist
            axios({
              url: "https://auth.roblox.com/v1/logout",
              method: "POST",
              headers: {
                  "cookie": `.ROBLOSECURITY=${cookie}`
              }
            }).catch(res => {
              const xcsrf = res.response.headers["x-csrf-token"];
              axios({
                url: "https://roblox.com/library/" + args[0],
                method: "GET",
                headers: {
                  "cookie": `.ROBLOSECURITY=${cookie}`
                }
              })
                .then(async res => {
                  const ownedItem = res.data.indexOf("This item is available in your inventory.") != -1 || res.data.indexOf("Item Owned") != -1;
                  const productId = ExtractStringByBrackets(res.data, `data-product-id="`, `"`, 64);

                  if (!ownedItem) {
                    axios({
                      url: `https://economy.roblox.com/v1/purchases/products/${productId}`,
                      method: "POST",
                      headers: {
                          "cookie": `.ROBLOSECURITY=${cookie}`,
                          "x-csrf-token": xcsrf,
                      },
                      data: {
                        expectedCurrency: ExtractStringByBrackets(res.data, `data-expected-currency="`, `"`, 64),
                        expectedPrice: ExtractStringByBrackets(res.data, `data-expected-price="`, `"`, 64),
                      }
                    })
                      .then(async res => { console.log(res); message.reply(`ID ${args[0]} successfully whitelisted!`)})
                      .catch(res => message.reply(`Failed to whitelist, error code: ${res.response != null ? res.response.status : "Unknown. Token got changed?"}`))
                  } else message.reply(`${args[0]} is already whitelisted.`);
                })
                .catch(res => message.reply(`Failed to fetch information, error code: ${res.response.status}`))
            })
          } else message.reply("Either there's no argument or it's not a number!");
        } else if (commandName == "test") message.reply("Hello! I'm alive!");
      }
    })

    // Login.
    BotClient.login(TOKEN);
  }
}
