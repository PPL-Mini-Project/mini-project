const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdFunding", function () {
  let SimpleStorage, owner, simpleStorage;

  beforeEach(async function () {
    // Get the contract factory and signers
    SimpleStorage = await ethers.getContractFactory("CrowdFunding");
    [owner, add1] = await ethers.getSigners();

    // Deploy the contract
    simpleStorage = await SimpleStorage.deploy();
  });

  it("create campaign", async function () {
    SimpleStorage = await ethers.getContractFactory("CrowdFunding");
    [owner, add1] = await ethers.getSigners();
    const provider = ethers.provider;
    console.log(await provider.getBalance(owner.address));
    console.log(await provider.getBalance(add1.address));
    await simpleStorage.createCampaign("a","b","a","s",["as","sd"],10,2);
    await simpleStorage.approveCampaign(0,1);
    console.log(12);
    console.log(await simpleStorage.unverifiedCampaign());
    await simpleStorage.approveCampaign(0,1);
    await simpleStorage.approveCampaign(0,1);
    await simpleStorage.donateCampaignToAgent(0,{value:10});
    console.log(await simpleStorage.getCampaign(0));
    console.log(await provider.getBalance(owner.address));
    console.log(await provider.getBalance(add1.address));   
    
    await simpleStorage.setAuditors(0,["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]);
    await simpleStorage.auditorResponce(0,2);
    // await simpleStorage.donateCampaignToUser(0,{sender:"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",value:10});
    console.log(await provider.getBalance(owner.address));
    console.log(await provider.getBalance(add1.address));   
    console.log(await simpleStorage.getCampaign(0));
  });
});
