"use client";

import "./Form.css";
import CrowdFunding from "../../../../contracts/artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { contractAddress } from "@/lib/constants";
import { getContractProviderOrSigner } from "@/functions/getSignerOrProvider";

const Form = ({ params }) => {

  const id = params.id;
  const [campaign, setCampaign] = useState();
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);

  

  async function getCampaignDetails() {

    const Contract = await getContractProviderOrSigner("provider");
    let data = await Contract.getCampaign(id);
    let temp = await Contract.getDonors(id)

    data = { ...data, donorAddresses: temp[0], donatedAmount: temp[1] };
    data = { ...data, fundingGoal: ethers.utils.formatEther(data.fundingGoal), amountRaised: ethers.utils.formatEther(data.amountRaised) };

    setCampaign(data);
    setLoading(false);
  }

  async function depositFund() {
    const Contract = await getContractProviderOrSigner("signer");
    // Send funds to Agent
    const tx = await Contract.donateCampaignToAgent(id, { value: amount });
    // Wait till the transaction completes
    await tx.wait();
    // Check if the campaign has reached the funding goal
    const status = await Contract.isOver(id);

    if (parseInt(status) != 0) {
      const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/aiDhkAXWq8Do6525ntyRUvWPzllHsIaP'); // Replace with your network URL

      // Step 2: Use the private key for your specific wallet address
      const privateKey = '702095a321a16f5c3342a21580fb79e7a7d27318dd50eea76c309a074af080e3';  // Replace with your actual private key
      const wallet = new ethers.Wallet(privateKey, provider);

      // Step 3: Set the signer for the specified wallet address
      const signer = wallet.connect(provider);

      const Contract1 = new ethers.Contract(contractAddress, CrowdFunding.abi, signer);

      await Contract1.donateCampaignToUser(id, { value: parseInt(status), gasLimit: 100000 });
    }

  }

  useEffect(() => {
    getCampaignDetails();
  }, [])

  if (loading) {
    return (
      <div className="loading">
        Laoding...
      </div>
    )
  }



  return (
    <div>
      <div className="CampaignForm">
        <div className="CampaignForm-Left">
          <div className="CampaignForm-title">
            <h1>Title : {campaign.title}</h1>
          </div>
          <div className="CampaignForm-Story">
            <h3>STORY:</h3>
            <p>{campaign.description}</p>
          </div>
          <div className="CampaignForm-Donators">
            <h3>DONATORS:</h3>
            <ol>
              {
                campaign.donorAddresses.map((address, index) => {

                  return (<li>{address} <span>{ethers.utils.formatEther(campaign.donatedAmount[index]) * 1000000000000000000} wei</span></li>);
                })
              }
            </ol>
          </div>
        </div>
        <div className="CampaignForm-Right">
          <div className="CampaignForm-countbox-container">
            <div className="CampaignForm-countbox">
              <h2 className="CampaignForm-countbox-number">{Math.round
                ((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 3600 * 24))}</h2>
              <p className="CampaignForm-countbox-label">Days left</p>
            </div>
            <div className="CampaignForm-countbox">
              <h2 className="CampaignForm-countbox-number">{campaign.donorAddresses.length}</h2>
              <p className="CampaignForm-countbox-label">Donators</p>
            </div>
            <div className="CampaignForm-countbox">
              <h2 className="CampaignForm-countbox-number">{(campaign.fundingGoal * 1000000000000000000)} wei</h2>
              <p className="CampaignForm-countbox-label">Goal</p>
            </div>
            <div className="CampaignForm-countbox">
              <h2 className="CampaignForm-countbox-number">{campaign.amountRaised * 1000000000000000000} wei</h2>
              <p className="CampaignForm-countbox-label">Amount Raised</p>
            </div>
          </div>

          <div className="CampaignForm-Documents">
            <h3>DOCUMENTS:</h3>
            <div className="pdf-preview">
              {
                campaign.documents.map((item:string, index:number) => (<><a href={item}>File {index}</a><br /></>))
              }

            </div>
            <button className="pdf-button" >
              View
            </button>
          </div>

          <div className="CampaignForm-FundBox">
            <p>
              Contribute to something meaningful !
            </p>
            <div className="CampaignForm-FundBox-Input">
              <input type="number" name="" placeholder="Eg: 1 wei" value={amount} onChange={(evt) => { setAmount(Number(evt.target.value)) }} />
              <button onClick={depositFund}>Fund Campaign</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Form;