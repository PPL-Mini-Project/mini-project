"use client";

import { useEffect, useState } from "react";
import { ethers, BigNumber } from "ethers";
import { useRouter } from 'next/navigation';
// import CrowdFunding from "../../../../contracts/artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";
import Crowdfunding from "@/CrowdFunding.json";
import { contractAddress } from "@/lib/constants";
import { getContractProviderOrSigner } from "@/functions/user";
import Navbar from "@/components/custom/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Campaign } from "@/lib/types";
import { subscribeToChannel } from "@/functions/Notifications";
import { depositFund } from "@/functions/fundTransfer";
import { getCampaignDetails } from "@/functions/campaign";
import { agentWallet, getAgentProviderOrSigner } from "@/functions/agent";
import { sendNotification } from "@/functions/Notifications";
import { chooseAuditors } from "@/functions/chooseAuditors";


const defaultValue: Campaign = {
  title: "",
  id: 0,
  creatorId: "",
  description: "",
  startDate: "",
  endDate: "",
  fundingGoal: 0,
  amountRaised: 0,
  documents: [],
  donorAddresses: [],
  donatedAmount: [],
  status: "",
  numberOfAuditors: 0,
  auditorAddress: [],
  auditorStatus: []
};


const CampaignDetails = ({ params }: { params: { id: Number } }) => {

  const { id } = params;
  const [campaign, setCampaign] = useState<Campaign>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDocuments, setShowDocuments] = useState(false);
  const [images, setImages] = useState();

  
  const weiInEth = 1e18;

  useEffect(() => {
    getCampaignDetails();
  }, []);

  async function getCampaignDetails() {
    try {
      const Contract = await getContractProviderOrSigner("provider");
      let data = await Contract.getCampaign(id);
      let temp = await Contract.getDonors(id);

      data = {
        ...data,
        donorAddresses: temp[0],
        donatedAmount: temp[1],
        fundingGoal: ethers.utils.formatEther(data.fundingGoal),
        amountRaised: ethers.utils.formatEther(data.amountRaised),
      };
      let lst = []
      for (let doc of data.documents) {
        if (doc.endsWith(".png") || doc.endsWith(".jpg") || doc.endsWith(".jpeg"))
          lst.push(doc);
      }
      if (lst.length == 0)
        lst.push("https://pixelplex.io/wp-content/uploads/2022/04/blockchain-in-crowdfunding-meta.jpg");
      setImages(lst);

      setCampaign(data);

    } catch (error) {
      console.error("Failed to fetch campaign details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  async function handleDonation() {
    if (!donationAmount || isNaN(parseFloat(donationAmount))) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const Contract = await getContractProviderOrSigner("signer");

      const tx = await Contract.donateCampaignToAgent(id, { value: donationAmount });
      await tx.wait();

      await subscribeToChannel();

      const status = await Contract.isOver(id);

      console.log(Number(status._hex));


      if (Number(status._hex) == 1) {

        const signer: ethers.Wallet = await agentWallet();

        const agentContract = await getAgentProviderOrSigner(signer);

        const auditors = await chooseAuditors(id);

        console.log(auditors);

        const tx = await agentContract.setAuditors(id, auditors);

        await tx.wait();

        await sendNotification("Confirm your Donation", campaign.title, auditors);
      }

      // toast({
      //   title: "Donation Successful",
      //   description: `You have successfully donated ${donationAmount} ETH.`,
      // });

      // Refresh campaign details
      setDonationAmount("");
      await getCampaignDetails();
    } catch (error) {
      console.error("Donation failed:", error);
      toast({
        title: "Donation Failed",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-9xl text-gray-300">Loading...</div>;
  }

  if (!campaign) {
    return <div className="flex justify-center items-center h-screen bg-gray-900">Campaign not found</div>;
  }

  const amountRaisedWei = BigInt(parseFloat(campaign.amountRaised) * weiInEth);
  const fundingGoalWei = BigInt(parseFloat(campaign.fundingGoal) * weiInEth);
  const percentageRaised = Number((amountRaisedWei * 100n) / fundingGoalWei);
  console.log(campaign);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar />
      <div className="flex-grow p-6 text-gray-300 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <div className="flex flex-col md:flex-row gap-6 flex-grow overflow-hidden">
            <div className="w-full md:w-1/3">
              <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
                {images.map((doc, index) => (
                  <img
                    key={index}
                    src={doc}
                    alt={`Campaign image ${index + 1}`}
                    className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}
                  />
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/50"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/50"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="w-full mt-4 text-gray-900 bg-blue-400 shadow-lg shadow-blue-400/50 hover:bg-blue-300"
                onClick={() => setShowDocuments(true)}
              >
                View Documents
              </Button>
            </div>
            <div className="w-full md:w-2/3 flex flex-col overflow-hidden">
              <h1 className="text-4xl font-bold mb-2">{campaign.title}</h1>
              <p className="text-gray-300 mb-4 text-xl">Creator: {campaign.creatorId}</p>
              <ScrollArea className="h-32 mb-4 rounded border p-4">
                <p className="text-lg text-gray-300">{campaign.description}</p>
              </ScrollArea>
              <div className="mb-4">
                <Progress
                  value={percentageRaised}
                  className="h-2 mb-2 bg-slate-600"
                  indicatorClassName="bg-green-300"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-lg">{amountRaisedWei.toString()} wei raised</span>
                  <span className="text-lg">
                    {percentageRaised.toFixed(2)}% of {fundingGoalWei.toString()} wei goal
                  </span>
                </div>
              </div>
              <div className="space-y-4 mb-4">
                <Input
                  className="text-lg"
                  type="number"
                  placeholder="Enter donation amount in ETH"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  style={{ color: "black" }}
                />
                <div className="flex justify-center">
                  <Button
                    className="w-1/3 text-gray-900 bg-green-400 shadow-lg shadow-green-400/50 hover:bg-green-300 text-lg"
                    onClick={handleDonation}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Donate"}
                  </Button>
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <h2 className="text-xl font-semibold mb-2 text-white">Donors</h2>
                <div className="border border-gray-600 rounded-lg overflow-hidden h-full flex flex-col">
                  <div className="bg-gray-700 p-2 font-semibold text-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>Donor Address</div>
                      <div className="text-right">Amount</div>
                    </div>
                  </div>
                  <ScrollArea className="flex-grow">
                    <div className="divide-y divide-gray-600">
                      {campaign.donorAddresses.map((address, index) => (
                        <div key={index} className="p-2 hover:bg-gray-700">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-sm truncate">{address}</div>
                            <div className="text-sm font-medium text-right">
                              {ethers.utils.formatEther(campaign.donatedAmount[index])} ETH
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Documents</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {campaign.documents.map((doc, index) => (
              <li key={index}>
                <a
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Document {index + 1}
                </a>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDetails;