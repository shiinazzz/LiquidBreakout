/*
cutymeo here, finally made a new bot in 2022.
Structure is probably better than old epic bot.
Though do not use a folder yet.
*/
const { Client, Intents } = require('discord.js');
const axios = require('axios');
const http = require('http');
const url = require('url');

const cookie = process.env.LBCookie;
const token = process.env.BotToken;
const prefix = ";";

const canWhitelist = true;
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

function checkAssetOwnership(userId, assetId) {
    return new Promise((resolve, reject) => {
        axios(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}/is-owned`)
        .then(res => {
            resolve(res.response.body);
        })
        .catch(res => {
            reject(false);
        })
    })
}

function whitelistAsset(userId, assetId) {
    return new Promise((resolve, reject) => {
        if (!isNaN(userId)) {
            checkAssetOwnership(userId, assetId)
            .then(res => {
                if (!res)
                    reject("You do not own this asset!");
            })
            .catch(_ => {
                reject("You do not own this asset!");
            })
        }
        axios({
            url: "https://auth.roblox.com/v1/logout",
            method: "POST",
            headers: {
                "cookie": `.ROBLOSECURITY=${cookie}`
            }
          }).catch(res => {
            const xcsrf = res.response.headers["x-csrf-token"];
            axios({
              url: "https://roblox.com/library/" + assetId,
              method: "GET",
              headers: {
                "cookie": `.ROBLOSECURITY=${cookie}`
              }
            })
              .then(async res => {
                const ownedItem = res.data.indexOf("This item is available in your inventory.") != -1 || res.data.indexOf("Item Owned") != -1;
                const productId = ExtractStringByBrackets(res.data, `data-product-id="`, `"`, 64);
                const expectedPrice = ExtractStringByBrackets(res.data, `data-expected-price="`, `"`, 64);
                const assetType = ExtractStringByBrackets(page, "data-asset-type=\"", "\"", 64);
                const isOnSale = ExtractStringByBrackets(page, "data-is-purchase-enabled=\"", "\"", 64) == "true";
                
                if (!isOnSale) reject("Item is not on-sale.");
                else if (assetType != "Model") reject("Item is not a model.")
                else if (expectedPrice != 0) reject("Item is not free.");
                else if (!ownedItem) {
                  axios({
                    url: `https://economy.roblox.com/v1/purchases/products/${productId}`,
                    method: "POST",
                    headers: {
                        "cookie": `.ROBLOSECURITY=${cookie}`,
                        "x-csrf-token": xcsrf,
                    },
                    data: {
                      expectedCurrency: ExtractStringByBrackets(res.data, `data-expected-currency="`, `"`, 64),
                      expectedPrice: expectedPrice,
                    }
                  })
                    .then(_ => { resolve(`ID ${assetId} successfully whitelisted!`)})
                    .catch(res => reject(`Failed to whitelist, error code: ${res.response != null ? res.response.status : "Unknown. Token got changed?"}`))
                } else resolve(`${assetId} is already whitelisted.`);
              })
              .catch(res => {reject(`Failed to fetch information, error code: ${res.response.status}`)})
          })
    })
}

http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url, true);
    var query = parsedUrl.query;

    switch (parsedUrl.pathname) {
        case "/whitelist":
            if (!query.assetId || isNaN(parseInt(query.assetId))) {
                res.write("missing or invalid assetId in params");
                res.writeHead(400);
            } else if (!query.userId || isNaN(parseInt(query.userId))) {
                res.write("missing or invalid userId in params");
                res.writeHead(400);
            } else {
                try {
                  (async function () {
                    const msg = await whitelistAsset(query.userId, query.assetId);
                    res.write(msg);
                    res.writeHead(200);
                  })()
                } catch (msg) {
                  res.write(msg);
                  res.writeHead(400);
                }
            }
        default:
            res.write("bot for lb, it do whitelist stuff which is cool and all");
            res.writeHead(200);
    }
    res.end();
}).listen(8080);
new http.Agent({
  keepAlive: true,
  maxSockets: 1,
  keepAliveMsecs: 15000
})

const BotClient = new Client({ partials: ["CHANNEL"], intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING ] });
    
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
					if (!canWhitelist && whitelistBypass.indexOf(message.author.id) == -1) {
						console.log(`${commandName} failed for ${message.author.id}: Whitelist is disabled for user`);
						return message.reply(`Cannot whitelist: Automatic whitelisting is disabled for the time being.`);
					}
					if (!process.env.AWS_REGION || process.env.AWS_REGION.search("ap") == -1) {
						console.log(`${commandName} failed for ${message.author.id}: Bot in incorrect region`);
						return message.reply(`Bot is in incorrect region. Please notify the bot developer to reboot. Until then, you cannot whitelist.`);
					}
          if (args[0] && !isNaN(parseInt(args[0]))) {
            // Will now attempt to automatically whitelist
	        console.log(`${commandName} begin processing for ${message.author.id}`);
            whitelistAsset(NaN, args[0])
            .then((msg) => {
                console.log(`${commandName} finished for ${message.author.id} message = ${msg}, ID = ${args[0]}`);
                message.reply(msg);
            })
            .catch((msg) => {
                console.log(`${commandName} failed for ${message.author.id} message = ${msg}, ID = ${args[0]}`);
                message.reply(msg);
            })
            
          } else message.reply("Either there's no argument or it's not a number!");
        } else if (commandName == "test") message.reply("Hello! I'm alive!");
      }
    })

    // Login.
    BotClient.login(token);
