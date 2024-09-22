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
    [owner] = await ethers.getSigners();

    // Deploy the contract
    simpleStorage = await SimpleStorage.deploy();
  });

  it("create campaign",async function (){
    await simpleStorage.createCampaign("a","b","a","s",0);
    await simpleStorage.createCampaign("a1","b1","a1","s1",0);
    await simpleStorage.createCampaign("a2","b2","a2","s2",0);
    console.log(await simpleStorage.getCampaign(0));
    console.log(await simpleStorage.getCampaign(1));
    console.log(await simpleStorage.getCampaign(2));
    console.log(await simpleStorage.getAllCampaigns());
    console.log(await simpleStorage.getDonors(0));
    
    
    // console.log("Signers",await ethers.getSigners());
    
    
  });
});

