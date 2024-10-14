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
        string[] documents;
        address[] donorAddresses; // Array to keep track of donor addresses
        uint[] donatedAmount;
        uint status;
        /*
         0 - Waiting for approval for on air
         1 - On Air
         2 - Goal Reached and waiting to release
         3 - Fund released successfully
         4 - Fund reverted
         5 - Reject
        */

        uint numberOfAuditors;
        address[] auditorAddress;
        uint[] auditorStatus;
    }

    struct FundRaiser {
        uint risk;
        uint[] previousCampaigns;
        bool exists;
    }

    struct Donor {
        uint[] campaigns;
        mapping(uint => uint) donation;
        uint[] auditCampaigns;
        mapping(uint => uint) auditCampaignStatus;
        bool exists;
    }

    //Array of objects to dynamically create a campaign by different users
    mapping(uint => Campaign) public campaigns;

    // FundRaiser and their Risk factor
    mapping(address => FundRaiser) fundRaiser;

    // Donors
    mapping(address => Donor) donors;

    uint numberOfCampaigns = 0;

    // Create a new campaign
    function createCampaign(string memory _title, string memory _description, string memory _startDate, string memory _endDate, string[] memory _documents, uint _fundingGoal) public {
        Campaign storage newCampaign = campaigns[numberOfCampaigns];
        uint risk;
        if (fundRaiser[msg.sender].exists == false) {
            risk = 50;
            FundRaiser storage user = fundRaiser[msg.sender];
            user.exists = true;
            user.risk = 50;
            user.previousCampaigns.push(numberOfCampaigns);
        } else {
            risk = fundRaiser[msg.sender].risk;
            fundRaiser[msg.sender].previousCampaigns.push(numberOfCampaigns);
        }
        newCampaign.creatorId = payable(msg.sender);
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.startDate = _startDate;
        newCampaign.endDate = _endDate;
        newCampaign.fundingGoal = _fundingGoal;
        newCampaign.amountRaised = 0;
        newCampaign.documents = _documents;
        // Temp
        newCampaign.status = 1;
        /*
            Number of Auditors = base auditor / base amount * goal * (1 + risk / 100) 
        */
        newCampaign.numberOfAuditors = (10 * _fundingGoal) / 100;
        numberOfCampaigns++;
    }

    // Get All Current Campaigns
    function getAllCampaigns() public view returns (Campaign[] memory, uint[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);
        uint[] memory ids = new uint[](numberOfCampaigns);
        Campaign memory campaign;
        uint j = 0;
        for (uint i = 0; i < numberOfCampaigns; i++) {
            campaign = campaigns[i];
            if (campaign.status == 1) {
                allCampaigns[j] = campaign;
                ids[j++] = i;
            }
        }
        return (allCampaigns, ids);
    }

    // View campaign details (excluding mapping)

    function getCampaign(uint _id) public view returns (address creatorId, string memory title, string memory description, string memory startDate, string memory endDate, uint fundingGoal, uint amountRaised, uint status, string[] memory documents, uint numberOfAuditors) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        Campaign storage campaign = campaigns[_id];
        return (campaign.creatorId, campaign.title, campaign.description, campaign.startDate, campaign.endDate, campaign.fundingGoal, campaign.amountRaised, campaign.status, campaign.documents, campaign.numberOfAuditors);
    }

    // View all donor details for a campaign(for mapping)
    function getDonors(uint _id) public view returns (address[] memory, uint[] memory) {
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
        Donor storage donor = donors[payable(msg.sender)];

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
            donor.donation[_id] = msg.value;
        } else {
            campaign.donatedAmount[position] += msg.value;
            donor.donation[_id] = msg.value + donor.donation[_id];
        }
        campaign.amountRaised += msg.value;

        address payable recipient = payable(0x1a8D151BC17d018a1934d178d1F7c735a4d7709a);
        recipient.transfer(msg.value);

        if (campaign.amountRaised >= campaign.fundingGoal) campaign.status = campaign.status + 1;
    }

    function isOver(uint _id) public view returns (uint) {
        Campaign storage camp = campaigns[_id];
        if (camp.amountRaised >= camp.fundingGoal) {
            return 1;
        }
        return 0;
    }

    function updateCampaignStatus(uint id, uint val) public {
        Campaign storage camp = campaigns[id];
        camp.status = val;
    }

    function donateCampaignToUser(uint _id) public payable {
        Campaign storage campaign = campaigns[_id];
        address payable recipient = campaign.creatorId;
        recipient.transfer(msg.value);
    }

    // Store Auditor Response
    function auditorResponce(uint id, uint status) public {
        Campaign storage campaign = campaigns[id];
        address[] storage auditorAddress = campaign.auditorAddress;
        Donor storage donor = donors[payable(msg.sender)];
        uint i = 0;
        for (i = 0; i < campaign.numberOfAuditors; i++) {
            if (auditorAddress[i] == msg.sender) break;
        }
        donor.auditCampaignStatus[id] = status; // 1 - Accept 2 - Reject
        campaign.auditorStatus[i] = status;
    }

    // Check whether 80% is reached or not If so transfer the amount
    // 1 - Transfer to FundRaiser
    // 0 - Wait
    // 2 - Revert the fund
    function auditStatus(uint id) public view returns (uint) {
        Campaign memory campaign = campaigns[id];
        uint accept = 0;
        uint reject = 0;
        for (uint i = 0; i < campaign.numberOfAuditors; i++) {
            if (campaign.auditorStatus[i] == 1) accept++;
            else if (campaign.auditorStatus[i] == 2) reject++;
        }
        if ((accept * 100) / campaign.numberOfAuditors >= 80) {
            campaign.status = campaign.status + 1;
            return 1;
        } else if ((reject * 100) / campaign.numberOfAuditors > 20) {
            campaign.status = campaign.status + 2;
            return 2;
        }
        return 0;
    }

    function getAmountRaised(uint id) public view returns (uint) {
        return campaigns[id].amountRaised;
    }

    // Choose Auditors
    function setAuditors(uint id) public {
        Campaign storage campaign = campaigns[id];
        uint numberOfAuditors = campaign.numberOfAuditors;
        uint[] memory donatedAmounts = campaign.donatedAmount;
        address[] memory donorAddress = campaign.donorAddresses;
        uint totalNumberOfDonors = donatedAmounts.length;

        if (totalNumberOfDonors <= numberOfAuditors) {
            campaign.auditorAddress = donorAddress;
            for (uint i = 0; i < donorAddress.length; i++) {
                campaign.auditorStatus.push(0);
                Donor storage temp = donors[donorAddress[i]];
                temp.auditCampaigns.push(id);
                temp.auditCampaignStatus[id] = 0;
            }
            return;
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
        uint med = ((numberOfAuditors - high) + 1) / 2;
        uint low = numberOfAuditors - (high + med);

        slice(0, high, donorAddress, id);
        slice((totalNumberOfDonors + 2) / 3, med, donorAddress, id);
        slice((totalNumberOfDonors + 1) / 2, low, donorAddress, id);

        for (uint i = 0; i < campaign.auditorAddress.length; i++) {
            Donor storage temp = donors[campaign.auditorAddress[i]];
            temp.auditCampaigns.push(id);
            temp.auditCampaignStatus[id] = 0;
        }
    }

    function slice(uint start, uint stop, address[] memory user, uint id) public {
        address[] storage audit = campaigns[id].auditorAddress;
        uint[] storage status = campaigns[id].auditorStatus;
        for (uint i = start; i < stop; i++) {
            audit.push(user[i]);
            status.push(0);
        }
    }

    function getAuditors(uint id) public view returns (address[] memory) {
        return campaigns[id].auditorAddress;
    }

    function revertAmount(address recipient) public payable {
        address payable receiver = payable(recipient);
        receiver.transfer(msg.value);
    }

    function getDonorDetails() public view returns (uint[] memory, uint[] memory, uint[] memory, uint[] memory) {
        Donor storage donor = donors[msg.sender];
        uint[] memory donatedAmount = new uint[](donor.campaigns.length);
        uint[] memory auditorStatus = new uint[](donor.auditCampaigns.length);
        uint i = 0;
        for (i = 0; i < donor.campaigns.length; i++) {
            donatedAmount[i] = donor.donation[i];
        }
        for (i = 0; i < donor.auditCampaigns.length; i++) {
            auditorStatus[i] = donor.auditCampaignStatus[i];
        }

        return (donor.campaigns, donatedAmount, donor.auditCampaigns, auditorStatus);
    }

    function fundRaiserPrevioudCampaigns(address user) public view returns (FundRaiser memory) {
        return fundRaiser[user];
    }

    function getPendingCampaigns() public view returns (Campaign[] memory, uint[] memory) {
        Campaign[] memory campaign = new Campaign[](numberOfCampaigns);
        uint[] memory ids = new uint[](numberOfCampaigns);
        uint j = 0;
        for (uint i = 0; i < numberOfCampaigns; i++) {
            if (campaigns[i].status == 0) {
                campaign[j] = campaigns[i];
                ids[j++] = i;
            }
        }
        return (campaign, ids);
    }
}
