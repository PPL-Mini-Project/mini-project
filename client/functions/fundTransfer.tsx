import { Campaign } from "@/lib/types";
import { agentWallet, getAgentProviderOrSigner } from "./agent";
import { sendNotification } from "./Notifications";
import { getContractProviderOrSigner } from "./user";
import { ethers } from "ethers";

async function depositFund(id: Number, amount: Number, campaign: Campaign) {
    const Contract = await getContractProviderOrSigner("signer");
    // Send funds to Agent
    const tx = await Contract.donateCampaignToAgent(id, { value: amount });
    // Wait till the transaction completes
    await tx.wait();
    // Check if the campaign has reached the funding goal
    const status = await Contract.isOver(id);

    if (parseInt(status) == 1) {
        const signer: ethers.Wallet = await agentWallet();

        const agentContract = await getAgentProviderOrSigner(signer);

        const tx = await agentContract.setAuditors(id);

        await tx.wait();

        const auditorAddress: string[] = await agentContract.getAuditors(id);

        console.log(auditorAddress);

        await sendNotification("Confirm your Donation", campaign.title, id, auditorAddress);
    }
}

async function transferToRaiser(id: Number) {
    const wallet = await agentWallet();
    const Contract = await getAgentProviderOrSigner(wallet);
    const amt = await Contract.getAmountRaised(id);
    await Contract.donateCampaignToUser(id, { value: amt });
}

async function revertFunds(id: Number) {
    const wallet = await agentWallet();
    const Contract = await getAgentProviderOrSigner(wallet);

    const data = Contract.getDonors(id);

    const donor = data[0];
    const amount = data[1];

    for (let i = 0; i < donor.length; i++) {
        const tx = await Contract.revertAmount(donor[i], { value: amount[i] });
        await tx.wait();
    }

    Contract.updateCampaignStatus(id,4);
}

export { depositFund, transferToRaiser, revertFunds }