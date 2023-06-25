import axios from "axios";
import { Response } from "express";
import mongoose from "mongoose";
import decodeAudio from "./audioDecoder/index"
import Meyda from "meyda";
import zlib from "node:zlib"

const ExternalFrequencyProcessorUrl = "https://externalsoundfrequencyprocessor.onrender.com";

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
        if (!inputStr || !translation || !newTranslation) {
            return "";
        }

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

// Schemas
const ApiKeySchema = new mongoose.Schema({
    value: String,
    assignOwner: String,
    associatedDiscordUser: String,
    enabled: Boolean,
    timeCreated: Number,
});

// Models
const ApiKeyModel = mongoose.model("apiKey", ApiKeySchema);

function CreateOutput(Code: number, Message?: string | null, Data?: any) {
    return {"code": Code, "message": Message, data: Data};
}

class Backend {
    private _privilegeKeyGenerator: IDConverterClass;

    public SelectedServerType: string
    public IDConverter: IDConverterClass;
    public RobloxToken: string;
    public RobloxAudioToken: string;
    public OutputCodes: {[index: string]: number} = {
        "OPERATION_SUCCESS": 0,
        "ALREADY_WHITELISTED": 1,
        "ERR_CANNOT_WHITELIST": 3,
        "ERR_NO_SESSION_TOKEN": 4, // Require a cookie change immediately
        "ERR_ITEM_NOT_OWNED_BY_USER": 5,
        "ERR_INVALID_ITEM": 6,
        "ERR_INVALID_API_KEY": 7,
        "ERR_INVALID_API_KEY_OWNER": 8
    };

    public LookupNameByOutputCode(Code: number) {
        return Object.keys(this.OutputCodes).find(key => this.OutputCodes[key] === Code) || "ERR_UNKNOWN";
    }

    public async CheckIfUserOwnItem(AssetId: number, UserId: number) {
        try {
            return (await axios(`https://inventory.roblox.com/v1/users/${UserId}/items/Asset/${AssetId}/is-owned`)).data
        } catch(_) {
            return false;
        }
    }
    public async GetSessionToken(Cookie: string): Promise<[boolean, any]> {
        let SessionToken: string | undefined = undefined;
        let FetchError = "";
        try {
            await axios({
                url: "https://auth.roblox.com/v2/logout",
                method: "POST",
                headers: {
                    cookie: `.ROBLOSECURITY=${Cookie}`,
                },
            });
        } catch (AxiosResponse: any) {
            SessionToken = AxiosResponse.response ? AxiosResponse.response.headers["x-csrf-token"] : undefined;
            if (AxiosResponse && !AxiosResponse.response) {
                FetchError = AxiosResponse;
            }
        }
        if (SessionToken == undefined)
            return [false, CreateOutput(
                this.OutputCodes.ERR_NO_SESSION_TOKEN,
                `Cannot whitelist: ${FetchError != "" ? "An error occured while attempting to call Roblox's API." : "Failed to obtain session token.\nContact the developer."}\n${FetchError}`
            )];
        return [true, SessionToken];
    }
    public async WhitelistAsset(AssetId: number, UserId: number) {
        const CreatorOwnedItem = await this.CheckIfUserOwnItem(AssetId, 138801491);
        if (CreatorOwnedItem)
            return CreateOutput(this.OutputCodes.ALREADY_WHITELISTED);

        if (!Number.isNaN(UserId)) {
            const OwnItem: boolean = await this.CheckIfUserOwnItem(AssetId, UserId);
            if (!OwnItem)
            return CreateOutput(
                this.OutputCodes.ERR_ITEM_NOT_OWNED_BY_USER,
                `Cannot whitelist: ${AssetId} is not owned by requested user.`
            );
        }

        let [FetchSessionSuccess, SessionToken] = await this.GetSessionToken(this.RobloxToken);
        if (!FetchSessionSuccess)
            return SessionToken

        let ItemData, ErrorResponse;
        try {
            ItemData = (await axios({
                url: `https://economy.roblox.com/v2/assets/${AssetId}/details`,
                method: "GET",
            })).data;
        } catch (AxiosResponse: any) { ErrorResponse = AxiosResponse; }
        if (!ItemData)
            return CreateOutput(
                this.OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Failed to obtain item data.\n${ErrorResponse.response ? ErrorResponse.response.statusText : ErrorResponse}`,
                {
                    "robloxErrorCode": ErrorResponse.response != null ? ErrorResponse.response.status : -1,
                    "robloxMessage": ErrorResponse.response != null ? ErrorResponse.response.statusText : null,
                }
            );
        
        const ProductId = ItemData.ProductId;
        const AssetType = ItemData.AssetTypeId;
        const IsOnSale = ItemData.IsPublicDomain;
        const ItemPrice = parseInt(ItemData.PriceInRobux);
    
        if (!IsOnSale)
            return CreateOutput(
                this.OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Item is not on-sale.`
            );
        else if (AssetType != 10)
            return CreateOutput(
                this.OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Item type is not a Model`
            );
        else if (!isNaN(ItemPrice) && ItemPrice > 0)
            return CreateOutput(
                this.OutputCodes.ERR_INVALID_ITEM,
                `Cannot whitelist: Item costs Robux.`
            );
        else {
            try {
                await axios({
                    url: `https://economy.roblox.com/v1/purchases/products/${ProductId}`,
                    method: "POST",
                    headers: {
                        cookie: `.ROBLOSECURITY=${this.RobloxToken}`,
                        "x-csrf-token": SessionToken,
                    },
                    data: {
                        expectedCurrency: 1,
                        expectedPrice: 0,
                    },
                });
                return CreateOutput(
                    this.OutputCodes.OPERATION_SUCCESS,
                    null,
                    {"shareableId": this.IDConverter.Short(AssetId.toString())}
                );
            } catch (AxiosResponse: any) {
                return CreateOutput(
                    this.OutputCodes.ERR_CANNOT_WHITELIST,
                    null,
                    {
                        "robloxErrorCode": AxiosResponse.response != null ? AxiosResponse.response.status : -1,
                        "robloxMessage": AxiosResponse.response != null ? AxiosResponse.response.statusText : null,
                    }
                )
            }
        }
    }    

    public async Internal_GetPlaceFile(PlaceId: number, ExpressResponse: Response) {
        try {
            const AxiosResponse = await axios({
                url: `https://assetdelivery.roblox.com/v1/asset/?id=${PlaceId}`,
                method: "GET",
                responseType: "stream",
                headers: {
                    cookie: `.ROBLOSECURITY=${this.RobloxToken}` 
                }
            });
            AxiosResponse.data.pipe(ExpressResponse);
        } catch (AxiosResponse: any) {
            ExpressResponse.sendStatus(400);
        }
    }

    public async IsValidApiKey(apiKey: string) {
        const document = await ApiKeyModel.findOne({ value: apiKey }).exec();
        if (document == null)
            return false;
        if (!document.enabled)
            return false;
        return true
    } 

    public async UserAlreadyHaveApiKey(user: string) {
        const foundDocument = await ApiKeyModel.findOne({$or: [
            { assignOwner: user },
            { associatedDiscordUser: user }
        ]}).exec();
        return foundDocument != null;
    }

    public async GenerateApiKey() {
        const documentCount = await ApiKeyModel.countDocuments().exec();
        return this._privilegeKeyGenerator.Short((documentCount * 8 + Date.now() * 2).toString());
    }

    public async CreateApiKeyEntry() {
        const newDocument = new ApiKeyModel({ value: await this.GenerateApiKey(), timeCreated: Date.now(), enabled: true });
        await newDocument.save();
        return newDocument.value;
    }

    public async SetApiKeyEntryValue(method: string, searchValue: string, valueName: string, value: string | boolean) {
        if (method == "byKey") {
            if (!(await this.IsValidApiKey(searchValue)))
                return CreateOutput(
                    this.OutputCodes.ERR_INVALID_API_KEY,
                    "API key do not exist or already disabled."
                )
            const document = await ApiKeyModel.findOne({ value: searchValue }).exec();
            await document!.updateOne({ [valueName]: value });
            
            return CreateOutput(this.OutputCodes.OPERATION_SUCCESS);
        } else if (method == "byOwner") {
            if (!(await this.UserAlreadyHaveApiKey(searchValue)))
                return CreateOutput(
                    this.OutputCodes.ERR_INVALID_API_KEY_OWNER,
                    "The specified user do not have API key."
                )
            const documents = await ApiKeyModel.find({$or: [
                { assignOwner: searchValue },
                { associatedDiscordUser: searchValue }
            ]}).exec();

            documents.forEach(async (document) => await document!.updateOne({ [valueName]: value }));

            return CreateOutput(this.OutputCodes.OPERATION_SUCCESS);
        }

        return CreateOutput(this.OutputCodes.OPERATION_SUCCESS); // lol dont ask why
    }

    public async GetApiKeysFromUser(User: string) {
        const documents = await ApiKeyModel.find({$or: [
            { assignOwner: User },
            { associatedDiscordUser: User }
        ]});
        return documents;
    }

    public async GetSoundFrequenciesData(SoundId: number, Compress: boolean) {
        let [FetchSessionSuccess, SessionToken] = await this.GetSessionToken(this.RobloxToken);

        if (!FetchSessionSuccess) {
            [FetchSessionSuccess, SessionToken] = await this.GetSessionToken(this.RobloxAudioToken);
            if (!FetchSessionSuccess)
                return SessionToken;
        }
        
        let AssetData, ErrorResponse;
        try {
            AssetData = (await axios({
                url: `https://assetdelivery.roblox.com/v1/assets/batch`,
                method: "POST",
                headers: {
                    cookie: `.ROBLOSECURITY=${this.RobloxToken}`,
                    "Roblox-Place-Id": 0,
                    "Roblox-Browser-Asset-Request": "true"
                },
                data: [{
                    requestId: SoundId,
                    assetId: SoundId
                }]
            })).data;
            if (AssetData[0]["errors"])
                AssetData = (await axios({
                    url: `https://assetdelivery.roblox.com/v1/assets/batch`,
                    method: "POST",
                    headers: {
                        cookie: `.ROBLOSECURITY=${this.RobloxAudioToken}`,
                        "Roblox-Place-Id": 0,
                        "Roblox-Browser-Asset-Request": "true"
                    },
                    data: [{
                        requestId: SoundId,
                        assetId: SoundId
                    }]
                })).data;
        } catch (AxiosResponse: any) { ErrorResponse = AxiosResponse; }
        if (!AssetData)
            return CreateOutput(
                this.OutputCodes.ERR_INVALID_ITEM,
                `Cannot get sound data: Failed to obtain item data.`,
                {
                    "robloxErrorCode": ErrorResponse && ErrorResponse.response != null ? ErrorResponse.response.status : -1,
                    "robloxMessage": ErrorResponse && ErrorResponse.response != null ? ErrorResponse.response.statusText : ErrorResponse,
                }
            );
        
        const audioUrl: string | undefined = AssetData[0]["location"];
        if (!audioUrl) 
            return CreateOutput(
                this.OutputCodes.ERR_INVALID_ITEM,
                `Cannot get sound data: Failed to find sound's url.`,
                {
                    "robloxData": AssetData,
                    "assetData": AssetData[0],
                }
            );

        
        let frequencyOutput: [[time: number, leftChannel: number, rightChannel: number, amplitudeSpan?: [Span: Array<number>, Length: number]]?] | string = [];
        if (this.SelectedServerType != "WEAK") {  
            const initialAudioBuffer: ArrayBuffer = (await axios.get(audioUrl, {responseType: "arraybuffer"})).data;
            const audioBuffer: Buffer = Buffer.from(initialAudioBuffer);
            const FFT_SIZE: number = 512;
                
            let decodedData = await decodeAudio(audioBuffer);
            let channelData: Float32Array = decodedData.getChannelData(0);
            let bufferStep = Math.floor(channelData.length / FFT_SIZE); // floor just in case
            let currentTime = 0;

            const timeDelay = 1 / 15;
            let currentDelay = 0;

            for (let i = 0; i < bufferStep; i++) {
                currentTime += FFT_SIZE / decodedData.sampleRate;
                if (currentTime < currentDelay)
                    continue;
                currentDelay = currentTime + timeDelay;

                let currentBufferData = channelData.slice(i * FFT_SIZE, (i + 1) * FFT_SIZE);
                let spectrum: Float32Array = Meyda.extract('amplitudeSpectrum', currentBufferData) as any;
                for (let j = 0; j < spectrum.length; j++) {
                    spectrum[j] /= 100; // Matches un4seen BASS (osu!lazer)
                }
                frequencyOutput.push([currentTime, 0, 0, [Array.from(spectrum), spectrum.length]]);
            }
        } else {
            try {
                frequencyOutput = (await axios.post(ExternalFrequencyProcessorUrl, {audioUrl: audioUrl})).data; 
            } catch (_) {
                frequencyOutput = [];
            }  
        }

        if (Compress) {
            frequencyOutput = zlib.deflateSync(typeof frequencyOutput != "string" ? JSON.stringify(frequencyOutput) : frequencyOutput).toString('base64');
        }

        return frequencyOutput;
    }

    constructor(SetRobloxToken?: string, SetRobloxAudioToken?: string, MongoDbUrl?: string, ServerType?: string) {
        if (SetRobloxToken == undefined)
            throw new Error("Backend: No Roblox Token was supplied.")
        if (SetRobloxAudioToken == undefined)
            SetRobloxAudioToken = "";
        if (MongoDbUrl == undefined)
            throw new Error("Backend: No MongoDB uri was supplied.")
        if (ServerType == undefined)
            ServerType = "WEAK";

        this.IDConverter = new IDConverterClass(
            "123456789*=+-aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ",
            "0123456789"
        );
        this._privilegeKeyGenerator = new IDConverterClass(
            "qwertyuiopasdfghjklzxcvbnm0192837465",
            "5432189076"
        )
        this.RobloxToken = SetRobloxToken;
        this.RobloxAudioToken = SetRobloxAudioToken;
        mongoose.connect(MongoDbUrl);
        this.SelectedServerType = ServerType;

        console.log("Backend initialize");
    }
}
export default Backend;