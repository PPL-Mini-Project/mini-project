const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdFunding", function () {
  let SimpleStorage,owner,simpleStorage

  beforeEach(async function () {
    // Get the contract factory and signers
    SimpleStorage = await ethers.getContractFactory("CrowdFunding");
    [owner,add1] = await ethers.getSigners();
    console.log(add1);
    

    // Deploy the contract
    simpleStorage = await SimpleStorage.deploy();
  });

  it("create campaign",async function (){
    await simpleStorage.createCampaign("a","b","a","s",["as","sd"],150);
    await simpleStorage.createCampaign("a1","b1","a1","s1",["as","sd"],120);
    await simpleStorage.createCampaign("a2","b2","a2","s2",["as","sd"],100);
    // console.log(await simpleStorage.getCampaign(0));
    // console.log(await simpleStorage.getCampaign(1));
    // console.log(await simpleStorage.getCampaign(2));
    // console.log(await simpleStorage.getAllCampaigns());
    // console.log(await simpleStorage.getDonors(0));
    //  await simpleStorage.setAuditors(1)
    // console.log(await simpleStorage.getAuditors(1));
    
    // // console.log("Signers",await ethers.getSigners());
    // [owner, recipient] = await ethers.getSigners();
    // await simpleStorage.revertAmount(recipient,{value:10});

    // console.log(
    //  await ethers.provider.getBalance(recipient.address)
    // );
    
    console.log(await simpleStorage.isOver(0));
    

  });
});

