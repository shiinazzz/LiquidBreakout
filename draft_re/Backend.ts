const OutputCodes = {
    "WhitelistSuccess": 0,
    "ItemNotOwnedByUser": 1
};

function LookupNameByOutputCode(Code: number) {
    return 
}

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

const IDConverter = new IDConverterClass(
    "123456789*=+-aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
    "0123456789"
)

function CreateOutput(Code: number, Message: string?, Data: {any: any}) {
    return {"code": Code, "message": Message, data: Data};
}

async function CheckIfUserOwnItem(AssetId: number, UserId: number): boolean {
	try {
		return (await axios(`https://inventory.roblox.com/v1/users/${userId}/items/Asset/${assetId}/is-owned`)).data
	} catch(_) {
        return false;
    }
}

async function WhitelistAsset(AssetId: number, UserId: number) {
    const OwnItem: boolean = await CheckIfUserOwnItem(AssetId, UserId);
    if (!OwnItem)
        return CreateOutput()
}

export {IDConverter, WhitelistAsset}