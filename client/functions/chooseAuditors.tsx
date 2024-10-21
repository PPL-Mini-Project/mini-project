import { agentWallet, getAgentProviderOrSigner } from "./agent";

async function chooseAuditors(id:Number){
    const agent = await agentWallet();
    const Contract = await getAgentProviderOrSigner(agent);
    const campaign =  await Contract.getCampaign(id);
    const numberOfAuditors = campaign.numberOfAuditors;
    const donors = await Contract.getDonors(id);
    const donorAddress = donors[0];
    const donatedAmount = donors[1];
    
    let temp = "";
    let tempNo = 0;

    if(numberOfAuditors._hex >= donorAddress.length){
        return donorAddress;
    }

    for(let i=0;i<donatedAmount.length-1;i++){
        for(let j=0;j<donatedAmount.length;j++){
            if(donatedAmount[j]._hex > donatedAmount[j+1]._hex){
                tempNo = donatedAmount[j];
                donatedAmount[j] = donatedAmount[j+1];
                donatedAmount[j+1] = donatedAmount[j];

                temp = donorAddress[j];
                donorAddress[j] = donorAddress[j+1];
                donorAddress[j+1] = donorAddress[j];
            }
        }
    }

    let high = Math.ceil(numberOfAuditors/3);
    let med = Math.ceil((numberOfAuditors - high)/2);
    let low = numberOfAuditors - (med+high);

    let noOfdonors = donorAddress.length;

    let auditors:string[] = [];
    auditors.push(...donorAddress.slice(0,high));
    auditors.push(...donorAddress.slice(Math.ceil(noOfdonors/3),Math.ceil(noOfdonors/3)+med));
    auditors.push(...donorAddress.slice(Math.ceil(noOfdonors/3)*2,(Math.ceil(noOfdonors/3)*2)+low));
    return auditors;
}

export {chooseAuditors};