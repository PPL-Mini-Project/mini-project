import { ethers } from "ethers";
import { contractAddress } from "@/lib/constants";
import CrowdFunding from "../../contracts/artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";


async function getContractProviderOrSigner(type: string) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const Signer = provider.getSigner();
    if (type == 'provider')
        return new ethers.Contract(contractAddress, CrowdFunding.abi, provider);
    return new ethers.Contract(contractAddress, CrowdFunding.abi, Signer);
}

async function getUserAccount() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return signer;
}

export {getContractProviderOrSigner,getUserAccount};