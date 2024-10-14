import { ethers } from "ethers";
import { contractAddress } from "@/lib/constants";
import CrowdFunding from "../../contracts/artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";

async function agentWallet() {
    const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/aiDhkAXWq8Do6525ntyRUvWPzllHsIaP'); // Replace with your network URL

    const privateKey = '702095a321a16f5c3342a21580fb79e7a7d27318dd50eea76c309a074af080e3';  // Replace with your actual private key
    const wallet = new ethers.Wallet(privateKey, provider);
    const signer = wallet.connect(provider);

    return signer;
}

async function getAgentProviderOrSigner(signer: ethers.Wallet) {
    const Contract = new ethers.Contract(contractAddress, CrowdFunding.abi, signer);
    return Contract;
}


export {agentWallet,getAgentProviderOrSigner};