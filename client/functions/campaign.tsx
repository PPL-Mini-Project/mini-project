import { Dispatch, SetStateAction } from "react";
import { ethers } from "ethers";
import { Campaign } from "@/lib/types";
import { getContractProviderOrSigner } from "./user";
import { uploadFiles } from "./ipfs";

// Create Campaign
async function createNewCampaign(newCampaign: Campaign, files: FileList, upload: (data: { data: File[]; options?: object }) => Promise<string[]>) {

    const Contract = await getContractProviderOrSigner("signer");
    const documents = await uploadFiles(files, upload);
    console.log(newCampaign)
    console.log(documents);

    try {
        await Contract.createCampaign(newCampaign.title, newCampaign.description, new Date().toString(), newCampaign.endDate, documents, Number(newCampaign.fundingGoal));
    }
    catch (e) {
        console.log(e);
    }

}

// Get all the current campaigns
async function getAllCampaigns() {
    const Contract = await getContractProviderOrSigner("provider");
    console.log(await Contract.getAllCampaigns());
    return await Contract.getAllCampaigns();
}

// Get specific campaign details
async function getCampaignDetails(id: Number, setCampaign: Dispatch<SetStateAction<Campaign>>, setLoading: Dispatch<SetStateAction<boolean>>) {

    const Contract = await getContractProviderOrSigner("provider");
    let data = await Contract.getCampaign(id);
    let temp = await Contract.getDonors(id);
    let campaign = {
        id: id,
        creatorId: data[0],
        title: data[1],
        description: data[2],
        startDate: data[3],
        endDate: data[4],
        fundingGoal: Number(ethers.utils.formatEther(data[5])),
        amountRaised: Number(ethers.utils.formatEther(data[6])),
        status: data[7],
        documents: data[8],
        numberOfAuditors: data[9],
        donorAddresses: temp[0],
        donatedAmount: temp[1]
    }

    // await Contract.auditorResponse

    setCampaign(campaign);
    setLoading(false);
}

// Pending Approval
async function getPendingCampaigns() {
    const Contract = await getContractProviderOrSigner("signer");
    return await Contract.getPendingCampaigns();
}

// Previous Campaign of a user
async function getPreviousCampaigns(address: string) {
    const Contract = await getContractProviderOrSigner("signer");
    return await Contract.fundRaiserPrevioudCampaigns(address);
}

export { getCampaignDetails, createNewCampaign, getAllCampaigns, getPendingCampaigns, getPreviousCampaigns };
