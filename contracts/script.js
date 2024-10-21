async function main() {
    // Get the contract factory
    const SimpleStorage = await ethers.getContractFactory("CrowdFunding");

    // Deploy the contract
    const simpleStorage = await SimpleStorage.deploy();

    console.log("SimpleStorage deployed to:", await simpleStorage.getAddress());
}

// Call the main function and handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });