// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "hardhat/console.sol";

contract CrowdFunding {
    //Campaign table(struct) to store each and every campaign and can be differentiated using creatorId
    struct Campaign {
        address payable creatorId;
        string title;
        string description;
        string startDate;
        string endDate;
        uint fundingGoal;
        uint amountRaised;
        bool isCompleted;
        string[] documents;
        address[] donorAddresses; // Array to keep track of donor addresses
        uint[] donatedAmount;

        string status;
        uint numberOfAuditors;
        address[] auditorAddress;
        bool[] auditorStatus;
    }

    //Array of objects to dynamically create a campaign by different users
    mapping(uint => Campaign) public campaigns;

    uint numberOfCampaigns = 0;

    // Create a new campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _startDate,
        string memory _endDate,
        string[] memory _documents,
        uint _fundingGoal
    ) public {
        Campaign storage newCampaign = campaigns[numberOfCampaigns];
        newCampaign.creatorId = payable(msg.sender);
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.startDate = _startDate;
        newCampaign.endDate = _endDate;
        newCampaign.fundingGoal = _fundingGoal;
        newCampaign.amountRaised = 0;
        newCampaign.isCompleted = false;
        newCampaign.documents = _documents;

        newCampaign.numberOfAuditors = 0;
        newCampaign.status = "waiting for approval";
        numberOfCampaigns++;
    }

    // Get All Cuurent Campaigns
    function getAllCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        Campaign memory campaign;
        for (uint i = 0; i < numberOfCampaigns; i++) {
            campaign = campaigns[i];
            if(keccak256(abi.encodePacked(campaign.status)) ==  keccak256(abi.encodePacked("on air")))
                allCampaigns[i] = campaign;
        }

        return allCampaigns;
    }

    // View campaign details (excluding mapping)
    function getCampaign(uint _id) public view returns (
            address creatorId,
            string memory title,
            string memory description,
            string memory startDate,
            string memory endDate,
            uint fundingGoal,
            uint amountRaised,
            bool isCompleted,
            string[] memory documents
        )
    {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        Campaign storage campaign = campaigns[_id];
        return (
            campaign.creatorId,
            campaign.title,
            campaign.description,
            campaign.startDate,
            campaign.endDate,
            campaign.fundingGoal,
            campaign.amountRaised,
            campaign.isCompleted,
            campaign.documents
        );
    }

    // View all donor details for a campaign(for mapping)
    function getDonors(
        uint _id
    ) public view returns (address[] memory, uint[] memory) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        Campaign storage campaign = campaigns[_id];
        return (campaign.donorAddresses, campaign.donatedAmount);
    }

    //Note:We are checking if a donor donated before if yes his value is updated in amtRaised
    //Else we are pushing him into array.By this we dont need to keep track of donorIndex

    // Donate to a  Agent
    function donateCampaignToAgent(uint _id) public payable {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        require(msg.value > 0, "Donation amount must be greater than zero");

        Campaign storage campaign = campaigns[_id];

        uint flag = 0;
        uint position = 0;
        for (uint i = 0; i < campaign.donorAddresses.length; i++) {
            if (campaign.donorAddresses[i] == msg.sender) {
                flag = 1;
                position = i;
            }
        }

        if (flag == 0) {
            campaign.donorAddresses.push(payable(msg.sender));
            campaign.donatedAmount.push(msg.value);
        } else {
            campaign.donatedAmount[position] += msg.value;
        }
        campaign.amountRaised += msg.value;

        // Transfer donation to the Agent (Make Sure bellow addres is stored in env ,its agent address)
        address payable recipient = payable(
            0x1a8D151BC17d018a1934d178d1F7c735a4d7709a
        );
        recipient.transfer(msg.value);
    }

    function isOver(uint _id) public view returns (uint) {
        Campaign storage camp = campaigns[_id];
        if (camp.amountRaised >= camp.fundingGoal) return camp.amountRaised;
        return 0;
    }

    function donateCampaignToUser(uint _id) public payable {
        Campaign storage campaign = campaigns[_id];
        address payable recipient = campaign.creatorId;
        recipient.transfer(msg.value);
    }

    
    // New Updation

    // Store Auditor Response
    function auditorResponce (uint id,bool status,address auditor) public returns(bool){
        Campaign storage campaign = campaigns[id];
        address[] storage auditorAddress = campaign.auditorAddress;
        uint i = 0;
        for(i=0;i<campaign.numberOfAuditors;i++){
            if(auditorAddress[i] == auditor)
                break;
        }
        campaign.auditorStatus[i] = status;

        // Check whether 80% is reached or not If so transfer the amount
        uint accept=0;
        for(i=0;i<campaign.numberOfAuditors;i++){
            if(campaign.auditorStatus[i] == true)
                accept++;
        }
        if((accept / campaign.numberOfAuditors) * 100 >= 80){
            return true;
        }
    }

    // Choose Auditors
    function chooseAuditors(uint id) public returns(address[] memory){
        Campaign storage campaign = campaigns[id];
        // uint numberOfAuditors = campaign.numberOfAuditors;
        uint numberOfAuditors = 10;
        uint[] storage donatedAmounts = campaign.donatedAmount;
        address[] storage donorAddress = campaign.donorAddresses;
        uint totalNumberOfDonors = donatedAmounts.length;
        
        if (totalNumberOfDonors <= numberOfAuditors){ 
            campaign.auditorAddress = donorAddress;
            return donorAddress;
        }

        uint tempAmt;
        address tempAddress;
        for (uint i = 0; i < (donorAddress.length - 1); i++) {
            for (uint j = 0; i < donorAddress.length; j++) {
                if (donatedAmounts[j] < donatedAmounts[j + 1]) {
                    tempAddress = donorAddress[j];
                    donorAddress[j] = donorAddress[j + 1];
                    donorAddress[j + 1] = tempAddress;

                    tempAmt = donatedAmounts[j];
                    donatedAmounts[j] = donatedAmounts[j + 1];
                    donatedAmounts[j + 1] = tempAmt;
                }
            }
        }
        
        uint high = (numberOfAuditors + 2) / 3; // ceil = a + (b-1) / b
        uint med = ((numberOfAuditors - high) + 1 )/ 2;
        uint low = numberOfAuditors - (high + med);

        slice(0,high,donorAddress,id);
        slice((totalNumberOfDonors + 2) / 3,med,donorAddress,id);
        slice((totalNumberOfDonors + 1) / 2,low,donorAddress,id);
        
        return campaign.auditorAddress;
    }

    function slice(uint start,uint stop,address[] memory donors,uint id) public{
        address[] storage audit = campaigns[id].auditorAddress;
        bool[] storage status = campaigns[id].auditorStatus;
        for(uint i = start;i<stop;i++){
            audit.push(donors[i]);
            status.push(false);
        }
    }
}
