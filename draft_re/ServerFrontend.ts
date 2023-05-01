import express, { Express, Request, Response } from "express";
import Backend from "./Backend";

class ServerFrontend {
    private _backend: Backend;
    public ServerApp: Express;

    constructor(Backend: any) {
        this._backend = Backend;

        console.log("ServerFrontend initialize");
        this.ServerApp = express();

        this.ServerApp.get('/', (Request: Request, Response: Response) => {
            Response.send("API site for Liquid Breakout.\nCurrent APIs:\n-Whitelisting\n-ID Converter");
        });
        this.ServerApp.get('/whitelist', async (Request: Request, Response: Response) => {
            const RequestQuery = Request.query;
            let AssetId: number = RequestQuery.assetId ? parseInt(RequestQuery.assetId.toString()) : NaN;
            let UserId: number = RequestQuery.userId ? parseInt(RequestQuery.userId.toString()) : NaN;

            if (isNaN(AssetId)) {
                Response.sendStatus(400);
                Response.send("Invalid assetId param.")
				return;
			}
            if (isNaN(UserId)) {
				Response.sendStatus(400);
                Response.send("Invalid userId param.")
				return;
            }

            Response.send(await this._backend.WhitelistAsset(AssetId, UserId));
        });
        this.ServerApp.get('/getshareableid', (Request: Request, Response: Response) => {
            const RequestQuery = Request.query;
            let AssetId: number = RequestQuery.assetId ? parseInt(RequestQuery.assetId.toString()) : NaN;

            if (isNaN(AssetId)) {
                Response.sendStatus(400);
                Response.send("Invalid assetId param.")
				return;
			}

            Response.send(this._backend.IDConverter.Short(AssetId.toString()));
        });
        this.ServerApp.get('/getnumberid', (Request: Request, Response: Response) => {
            const RequestQuery = Request.query;
            let AssetId: number = RequestQuery.assetId ? parseInt(RequestQuery.assetId.toString()) : NaN;
            let ApiKey: string = RequestQuery.apiKey ? RequestQuery.apiKey.toString() : "NULL";

            if (isNaN(AssetId)) {
                Response.sendStatus(400);
                Response.send("Invalid assetId param.")
				return;
			}
            if (ApiKey == "NULL" || ApiKey != this._backend.PrivilegeApiKey) {
				Response.sendStatus(400);
                Response.send("Invalid apiKey param or API key has been invalidated.")
				return;
            }

            Response.send(this._backend.IDConverter.Number(AssetId.toString()));
        });

        this.ServerApp.listen(8000, () => {
            console.log(`ServerFrontEnd: Ready for request`);
        });
    }
}

export default ServerFrontend;