import { GetConfig, SaveConfig } from "../../wailsjs/go/main/App";
import { config } from "../../wailsjs/go/models";

export async function GetStorage(): Promise<config.Config> {
    return await GetConfig();
}

export async function SaveStorage(config: config.Config) {
    await SaveConfig(config);
}