import { getContractProviderOrSigner } from "./user";

 // Get all the current campaigns
export default async function getAllCampaigns() {
    const Contract = await getContractProviderOrSigner("provider");
    const allCampaigns = await Contract.getAllCampaigns();
    return allCampaigns;
  }