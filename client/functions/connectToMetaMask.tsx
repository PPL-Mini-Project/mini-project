import { useQuery } from "@tanstack/react-query";
import fetchEthereumAccount from '@/functions/fetchEthereumAccount';
import getAllCampaigns from '@/functions/getAllCampaigns';
import { ethers } from "ethers";


export default async function connectToMetaMask() {
  if (window.ethereum) {
    // Fetch the Ethereum account from cache or make the request
    const account = await fetchEthereumAccount();

    // Fetch campaigns data
    let data = await getAllCampaigns();

    let campaigns = [];

    console.log(data);
    
    for(let i = 0;i<data.length;i++){
      console.log(data[i].title);
      
      if(data[i].title != ""){
        campaigns.push(data[i]);
      }
    }

    console.log(campaigns);

    return { account, campaigns };
  } else {
    throw new Error('MetaMask not found. Please install MetaMask to use this application.');
  }
};
