 //Get the ethereum account from the window
 export default async function fetchEthereumAccount() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log(accounts);
        
        return accounts[0];  // Return the first account
      } catch (error) {
        throw new Error("Failed to fetch Ethereum account: " + error.message);
      }
    } else {
      throw new Error("Ethereum object not found. Install MetaMask.");
    }
  };