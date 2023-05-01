import axios from "axios";

const OutputCodes = {
    "WHITELIST_SUCCESS": 0,
    "ALREADY_WHITELISTED": 1,
    "ERR_CANNOT_WHITELIST": 3,
    "ERR_NO_SESSION_TOKEN": 4, // Require a cookie change immediately
    "ERR_ITEM_NOT_OWNED_BY_USER": 5,
    "ERR_INVALID_ITEM": 6
};

function reverseString(inputStr: string): string {
    let strArray: Array<string> = inputStr.split(" ");
    let reversedStrArray: Array<string> = strArray.map((word) => {
        let charArray: Array<string> = word.split("");
        charArray.reverse();

        let reversed: string = charArray.join("");
        return reversed;
    }).reverse();

    let reversedStr: string = reversedStrArray.join(" ");
    return reversedStr;
}

class IDConverterClass {
    private _alphabets: {"alphabet": string, "decimals": string}
    
    private convert(inputStr: string, translation: string, newTranslation: string, shift: boolean): string {
        let x: number = 0;
        let baseValue: number = translation.length;
    
        for (let i = 0; i < inputStr.length; i++) {
            const digit: string = inputStr[i];
            let digitIndex: number = translation.indexOf(digit) + 1;
            digitIndex -= shift ? 1 : 0
    
            x = x * baseValue + digitIndex
        }
    
        if (x != 0) {
            let result: string = "";
            const newBaseVal = newTranslation.length;
    
            while (x > 0) {
                let digitVal: number = x % newBaseVal;
                digitVal -= shift ? 1 : 0;
                let appendNew = digitVal == -1 ? "0" : newTranslation[digitVal];
    
                if (appendNew == undefined)
                    return shift ? reverseString(`ID Error: ${digitVal} index is out of range`) : `ID Error: ${digitVal} index is out of range`;
    
                result = `${appendNew}${result}`;
                x = Math.floor(x / newBaseVal);
            }
    
            return result;
        } else return newTranslation[0]
    }
    public Short(inputStr: string): string {
        return reverseString(this.convert(inputStr, this._alphabets.decimals, this._alphabets.alphabet, true));
    }
    public Number(inputStr: string): string {
        return this.convert(reverseString(inputStr), this._alphabets.alphabet, this._alphabets.decimals, false);
    }

    constructor(alphabet: string, decimals: string) {
        this._alphabets = {
            "alphabet": alphabet,
            "decimals": decimals
        }
    }
}

function CreateOutput(Code: number, Message: string?, Data: {any: any}) {
    return {"code": Code, "message": Message, data: Data};
}

class Backend {
    private _idConverter: IDConverterClass;
    public RobloxToken: string;

    public LookupNameByOutputCode(Code: number) {
        return Object.keys(OutputCodes).find(key => OutputCodes[key] === Code) || "ERR_UNKNOWN";
    }

    public async CheckIfUserOwnItem(AssetId: number, UserId: number): boolean {
        try {
            return (await axios(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}/is-owned`)).data
        } catch(_) {
            return false;
        }
    }
    public async WhitelistAsset(AssetId: number, UserId: number) {
        const CreatorOwnedItem = await this.CheckIfUserOwnItem(AssetId, 138801491);
        if (!CreatorOwnedItem)
            return CreateOutput(OutputCodes.ALREADY_WHITELISTED);
    
        const OwnItem: boolean = await this.CheckIfUserOwnItem(AssetId, UserId);
        if (!OwnItem)
            return CreateOutput(
                OutputCodes.ERR_ITEM_NOT_OWNED_BY_USER,
                `Cannot whitelist: ${AssetId} is not owned by requested user.`
            );
        
        let SessionToken: string | undefined = undefined;
        try {
            await axios({
                url: "https://auth.roblox.com/v2/logout",
                method: "POST",
                headers: {
                    cookie: `.ROBLOSECURITY=${cookie}`,
                },
            });
        } catch (AxiosResponse) {
            SessionToken = AxiosResponse.response.headers["x-csrf-token"];
        }
        if (SessionToken == undefined)
            return CreateOutput(
                OutputCodes.ERR_NO_SESSION_TOKEN,
                "Cannot whitelist: Failed to obtain session token.\nContact the developer."
            );
        
        let ItemData, ErrorResponse;
        try {
            ItemData = (await axios({
                url: `https://economy.roblox.com/v2/assets/${assetId}/details`,
                method: "GET",
            })).data;
        } catch (AxiosResponse) { ErrorResponse = AxiosResponse; }
        if (!ItemData)
            return CreateOutput(
                OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Failed to obtain item data.`,
                {
                    "robloxErrorCode": ErrorResponse.response != null ? res.response.status : -1,
                    "robloxMessage": ErrorResponse.response != null ? res.response.statusText : null,
                }
            );
        
        const ProductId = ItemData.ProductId;
        const AssetType = ItemData.AssetTypeId;
        const IsOnSale = ItemData.IsPublicDomain;
        const ItemPrice = parseInt(ItemData.PriceInRobux);
    
        if (!IsOnSale)
            return CreateOutput(
                OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Item is not on-sale.`
            );
        else if (AssetType != 10)
            return CreateOutput(
                OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Item type is not a Model`
            );
        else if (!isNaN(ItemPrice) && ItemPrice > 0)
            return CreateOutput(
                OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Item costs Robux.`
            );
        else {
            try {
                await axios({
                    url: `https://economy.roblox.com/v1/purchases/products/${productId}`,
                    method: "POST",
                    headers: {
                        cookie: `.ROBLOSECURITY=${cookie}`,
                        "x-csrf-token": SessionToken,
                    },
                    data: {
                        expectedCurrency: 1,
                        expectedPrice: 0,
                    },
                });
                return CreateOutput(
                    OutputCodes.WHITELIST_SUCCESS,
                    null,
                    {"shareableId": this._idConverter.Short(AssetId.toString())}
                );
            } catch (AxiosResponse) {
                return CreateOutput(
                    OutputCodes.ERR_CANNOT_WHITELIST,
                    null,
                    {
                        "robloxErrorCode": AxiosResponse.response != null ? AxiosResponse.response.status : -1,
                        "robloxMessage": AxiosResponse.response != null ? AxiosResponse.response.statusText : null,
                    }
                )
            }
        }
    }    

    constructor(SetRobloxToken: string) {
        this._idConverter = new IDConverterClass(
            "123456789*=+-aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
            "0123456789"
        );
        this.RobloxToken = SetRobloxToken;
    }
}
export = Backend