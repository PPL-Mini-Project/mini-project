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
        numberOfCampaigns++;
    }

    // Get All campaigns
    function getAllCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for (uint i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];

            allCampaigns[i] = item;
        }

        return allCampaigns;
    }

    // View campaign details (excluding mapping)
    function getCampaign(
        uint _id
    )
        public
        view
        returns (
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
    function donateCampaignToAgent(uint _id) public payable{
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

    function isOver(uint _id) public view returns(uint){
        Campaign storage camp = campaigns[_id];
        if(camp.amountRaised >= camp.fundingGoal)
            return camp.amountRaised;
        return 0;
    }

    function donateCampaignToUser(uint _id) public payable {
        Campaign storage newcampaign = campaigns[_id];

        //0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
        address payable recipient = newcampaign.creatorId;
        //recipient.transfer(msg.value);

        //Converting wei to ethers and sending the amountRaised to the campaign raiser
        recipient.transfer(msg.value);
    }
}
