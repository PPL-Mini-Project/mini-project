// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract CrowdFunding {
    //Campaign table(struct) to store each and every campaign and can be differentiated using creatorId
    struct Campaign {
        uint campaignId;
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
        //FOR APPROVAL/DECLINE
        //0-No Action
        //1-Approved
        //2-Declined

        uint[] verificationStatus; //Approve/Decline given by admin
        address[] adminAddress;
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

    function getFundRaiserDetails(address addr) public view returns (FundRaiser memory) {
        return fundRaiser[addr];
    }

    function initializeFundRaiser(address addr) public {
        FundRaiser storage user = fundRaiser[addr];
        user.risk = 50;
        user.exists = true;
    }

    // Create a new campaign
    function createCampaign(string memory _title, string memory _description, string memory _startDate, string memory _endDate, string[] memory _documents, uint _fundingGoal, uint auditors) public {
        Campaign storage newCampaign = campaigns[numberOfCampaigns];
        if (fundRaiser[msg.sender].exists == false) {
            initializeFundRaiser(msg.sender);
        }
        newCampaign.creatorId = payable(msg.sender);
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.startDate = _startDate;
        newCampaign.endDate = _endDate;
        newCampaign.fundingGoal = _fundingGoal;
        newCampaign.amountRaised = 0;
        newCampaign.documents = _documents;
        newCampaign.status = 0;
        newCampaign.numberOfAuditors = auditors;
        newCampaign.campaignId = numberOfCampaigns;
        numberOfCampaigns++;
    }

    // Get All Current Campaigns
    function getAllCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);
        uint index = 0;
        for (uint i = 0; i < numberOfCampaigns; i++) {
            if (campaigns[i].status == 1) {
                allCampaigns[index++] = campaigns[i];
            }
        }
        return allCampaigns;
    }

    // View campaign details (excluding mapping)
    function getCampaign(uint _id) public view returns (Campaign memory) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        Campaign storage campaign = campaigns[_id];
        return campaign;
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
            donor.campaigns.push(_id);
        } else {
            campaign.donatedAmount[position] += msg.value;
            donor.donation[_id] = msg.value + donor.donation[_id];
        }
        campaign.amountRaised += msg.value;

        address payable recipient = payable(0x1a8D151BC17d018a1934d178d1F7c735a4d7709a);
        // address payable recipient = payable(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);

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

    function donateCampaignToUser(uint _id) public payable {
        Campaign storage campaign = campaigns[_id];
        address payable recipient = campaign.creatorId;
        recipient.transfer(msg.value);
        campaign.status = campaign.status + 1;
        FundRaiser storage raiser = fundRaiser[campaign.creatorId];
        if(raiser.risk >= 5)
            raiser.risk = raiser.risk - 5;
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
            return 1;
        } else if ((reject * 100) / campaign.numberOfAuditors > 20) {
            return 2;
        }
        return 0;
    }

    function getAmountRaised(uint id) public view returns (uint) {
        return campaigns[id].amountRaised;
    }

    // Choose Auditors
    function setAuditors(uint id, address[] memory auditors) public {
        Campaign storage campaign = campaigns[id];
        campaign.auditorAddress = auditors;
        campaign.numberOfAuditors = auditors.length;
        for (uint i = 0; i < auditors.length; i++) {
            Donor storage temp = donors[payable(auditors[i])];
            temp.auditCampaigns.push(id);
            temp.auditCampaignStatus[id] = 0;
            campaign.auditorStatus.push(0);
        }
    }

    function getAuditors(uint id) public view returns (address[] memory) {
        return campaigns[id].auditorAddress;
    }

    function updateCampaignStatus(uint id) public {
        Campaign storage campaign = campaigns[id];
        campaign.status = campaign.status + 2;
        FundRaiser storage raiser = fundRaiser[campaign.creatorId];
        raiser.risk = raiser.risk + 5;
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

    // INITIAL VERIFICATION STEP

    function responded(Campaign memory campaign, address sender) public pure returns (bool) {
        for (uint i = 0; i < campaign.adminAddress.length; i++) {
            if (campaign.adminAddress[i] == sender) return true;
        }
        return false;
    }

    // Function to return only unverified campaigns
    function unverifiedCampaign() public view returns (Campaign[] memory) {
        uint unverifiedCount = 0;

        for (uint i = 0; i < numberOfCampaigns; i++) {
            if (campaigns[i].status == 0 && !responded(campaigns[i], msg.sender)) {
                unverifiedCount++;
            }
        }

        Campaign[] memory unverifiedCampaigns = new Campaign[](unverifiedCount);
        uint index = 0;

        for (uint i = 0; i < numberOfCampaigns; i++) {
            if (campaigns[i].status == 0 && !responded(campaigns[i], msg.sender)) {
                unverifiedCampaigns[index++] = campaigns[i];
            }
        }

        return unverifiedCampaigns;
    }

    function approveCampaign(uint _id, uint status) public {
        Campaign storage campaign = campaigns[_id];
        campaign.verificationStatus.push(status);
        campaign.adminAddress.push(msg.sender);

        if (campaign.verificationStatus.length == 3) {
            uint cnt = 0;
            for (uint i = 0; i < campaign.verificationStatus.length; i++) {
                if (campaign.verificationStatus[i] == 1) {
                    cnt++;
                }
            }
            if (cnt >= 2) {
                campaign.status = 1;
            } else {
                campaign.status = 5;
            }
        }
    }
}
