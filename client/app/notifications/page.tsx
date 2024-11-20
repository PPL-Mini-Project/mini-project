"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getContractProviderOrSigner } from "@/functions/user";
import Navbar from "@/components/custom/Navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BigNumber, ethers } from "ethers";
import HeroImage from "@/public/HeroImage.png";
import "./notification.css";
import { agentWallet, getAgentProviderOrSigner } from "@/functions/agent";
import { sendNotification } from "@/functions/Notifications";
// import { BigNumber, ethers } from "ethers";

const CampaignList = () => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [campaignIds, setCampaignIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [mode, setMode] = useState("audit");
  const [digitalData, setDigitalData] = useState({
    digitalSignature: "",
    digitalSignaturePublicKey: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  // State for button status for each campaign
  const [buttonStates, setButtonStates] = useState({});

  // Function to initialize button state for a campaign
  const initializeButtonState = (campaignId) => ({
    color: "bg-blue-500",
    disabled: false,
    text: "Verify",
  });

  // Function to update the button state for a specific campaign
  const updateButtonState = (campaignId, newState) => {
    setButtonStates((prevState) => ({
      ...prevState,
      [campaignId]: { ...prevState[campaignId], ...newState },
    }));
  };

  async function getPendingCampaigns() {
    try {
      console.log(122);
      const Contract = await getContractProviderOrSigner("signer");
      const campaigns = await Contract.unverifiedCampaign();
      console.log(campaigns);
      setCampaigns(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function getAuditCampaigns() {
    console.log(12);

    try {
      const Contract = await getContractProviderOrSigner("signer");
      const data = await Contract.getDonorDetails();
      console.log(data);

      const camp = data[2];
      const status = data[3];

      let campaigns = [];
      let ids = [];
      for (let i = 0; i < camp.length; i++) {
        if (status[i] == 0) {
          campaigns.push(await Contract.getCampaign(camp[i]));
        }
      }
      setCampaigns(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleInfoClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDescription(true);
  };

  const handleApproveAndReject = async (flag: boolean, id: BigNumber, creator: string, title: string) => {
    setLoading(true);
    console.log("Approve campaign", Number(id._hex));
    const Contract = await getContractProviderOrSigner("signer");

    // Auditor Mode
    if (mode === "audit") {
      // Update Audior Response
      if (flag) {
        const tx = await Contract.auditorResponce(Number(id._hex), 1);
        await tx.wait();
      }
      else {
        const tx = await Contract.auditorResponce(Number(id._hex), 2);
        await tx.wait();
      }

      // Check for Campaign Auditing status
      const status = await Contract.auditStatus(Number(id._hex));
      console.log(status._hex);

      // Initialize Agent
      const agent = await agentWallet();
      const Contract1 = await getAgentProviderOrSigner(agent);

      // Success
      if (status._hex == 1) {
        const amt = await Contract1.getAmountRaised(id);
        const tx = await Contract1.donateCampaignToUser(id, { value: Number(amt._hex) });
        await tx.wait();
        await sendNotification(title, "Funds has been transferred to your wallet", [creator]);
      }

      // Failure
      else if (status._hex == 2) {
        const data = await Contract1.getDonors(id);
        const addresses = data[0];
        const amount = data[1];
        await Contract1.updateCampaignStatus(id._hex);
        for (let i = 0; i < addresses.length; i++) {
          let tx = await Contract1.revertAmount(addresses[i], {
            value: Number(amount[i]._hex),
          });
          await tx.wait();
          await sendNotification(title, "Funds has been reverted to your wallet", [addresses[i]]);
        }
        await sendNotification(title, "Campaign Failed during Audit Process", [creator]);
      }
    }
    // Admin Mode
    else {
      let tx = undefined;
      if (flag)
        tx = await Contract.approveCampaign(Number(id._hex), 1);
      else
        tx = await Contract.approveCampaign(Number(id._hex), 2);
      await tx.wait();

    }

    setLoading(false);
  };

  useEffect(() => {
    if (mode === "audit") getAuditCampaigns();
    else getPendingCampaigns();
  }, [mode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-gray-900 text-9xl text-gray-300">
        Loading...
      </div>
    );
  }

  const digitalSignatureChange = (e) => {
    const { name, value } = e.target;
    setDigitalData({ ...digitalData, [name]: value });
    console.log(digitalData);
  };

  //Verification function that check if file is authentic and not tampered
  const verifyFileSignature = async (campaignId) => {
    if (
      digitalData.digitalSignature == "" ||
      digitalData.digitalSignaturePublicKey == ""
    ) {
      alert("Enter the verifications keys");
      return;
    }
    if (!pdfFile) {
      alert("Enter the file");
      return;
    }

    try {
      const fileHash = await hashFile(pdfFile);
      const recoveredAddress = ethers.utils.verifyMessage(
        fileHash,
        digitalData.digitalSignature,
      );
      console.log(recoveredAddress, digitalData);

      if (recoveredAddress.toLowerCase() === digitalData.digitalSignaturePublicKey.toLowerCase()) {
        alert("Signature is valid and file is authentic.");
        updateButtonState(campaignId, {
          color: "bg-green-500",
          disabled: true,
          text: "Verified",
        });
      } else {
        alert("Invalid signature or file tampered.");
        updateButtonState(campaignId, {
          color: "bg-red-500",
          disabled: true,
          text: "Failed",
        });
      }
    } catch (error) {
      console.error("Error verifying the file signature:", error);
      alert("Error verifying the signature.");
    }
  };

  //Function to set the file
  const handleFileUpload = async (e) => {
    setPdfFile(e.target.files[0]);
  };

  //Function to read the content and hash the file content
  const hashFile = async (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        const fileHash = ethers.utils.keccak256(uint8Array); // Keccak256 hash belongs to SHA-3 family and its superior so ithu poten
        console.log(fileHash);
        resolve(fileHash);
      };
      reader.onerror = (error) => {
        reject("Error reading file: " + error);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  function chooseImage(documents) {
    for (let doc of documents) {
      if (doc.endsWith(".png") || doc.endsWith(".jpg") || doc.endsWith(".jpeg"))
        return doc;
    }
    return "https://pixelplex.io/wp-content/uploads/2022/04/blockchain-in-crowdfunding-meta.jpg"
  }

  // if (loading) {
  //   <div className="h-full flex flex-col justify-center items-center ">
  //     <h1 className="text-7xl text-white text-center mb-5">Processing...</h1>
  //     <h5 className="text-3xl text-white text-center">This might take a few seconds</h5>
  //   </div>
  // }

  return (
    <div className="flex flex-col w-screen min-h-screen bg-gray-900">
      <Navbar />
      <div className="w-screen admin-section">
        <Button
          className={
            mode != "audit"
              ? "w-3/6 h-full text-lg bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              : "w-3/6 h-full text-lg"
          }
          onClick={() => {
            setMode("pending");
          }}
        >
          <h1>Pending Approval</h1>
        </Button>
        <Button
          className={
            mode === "audit"
              ? "w-3/6 h-full text-lg bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              : "w-3/6 h-full text-lg"
          }
          onClick={() => {
            setMode("audit");
          }}
        >
          <h1>Audit</h1>
        </Button>
      </div>
      <div className="flex-grow p-6 text-gray-300 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <h1 className="text-3xl font-bold mb-6">
            {mode === "audit"
              ? "Campaigns for Audit"
              : "Campaigns for Approval"}
          </h1>
          {
            campaigns.length == 0 ?
              mode === "audit" ?

                <div className="h-96 flex justify-center items-center">
                  <h1 className="text-white text-4xl">No Campaigns Pending for Audit!</h1>
                </div> :
                <div className="h-96 flex justify-center items-center">
                  <h1 className="text-white text-4xl">No Campaigns Pending for Verification!</h1>
                </div>
              :
              <ScrollArea className="flex-grow">
                <div className="space-y-4">
                  {campaigns.map((campaign, index) => (
                    <Card
                      key={campaign.campaignId}
                      className="bg-gray-800 text-gray-300 overflow-hidden h-48"
                    >
                      <CardContent className="p-0 flex">
                        <div className="w-1/4 relative">
                          <img
                            src={chooseImage(campaign.documents)}
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h2 className="text-2xl font-semibold">
                                {campaign.title}
                              </h2>
                              <p className="text-lg text-gray-400">
                                Creator: {campaign.creatorId}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleInfoClick(campaign)}
                              className="mt-1"
                            >
                              <Info className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-900 border border-gray-400 hover:bg-gray-700 hover:text-gray-300"
                              onClick={() =>
                                window.open(campaign.documents[0], "_blank")
                              }
                            >
                              View Document(s)
                            </Button>
                          </div>

                          {
                            mode != "audit" &&

                            <div className="flex flex-col space-y-4">
                              {/* First Row: Two Input fields in a single row with SVG icons */}
                              <div className="flex space-x-4">
                                {/* Public Key Input with SVG Icon */}
                                <div className="relative w-full">
                                  <svg
                                    fill="#FFF"
                                    width="24px"
                                    height="24px"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                                  >
                                    <path d="M8.5 11c0 .732.166 1.424.449 2.051l-3.949 3.949v1.5s.896 1.5 2 1.5h2v-2h2v-2h2.5c2.762 0 5-2.238 5-5s-2.238-5-5-5-5 2.238-5 5zm5 2c-1.104 0-2-.896-2-2 0-1.105.896-2.002 2-2.002 1.105 0 2 .896 2 2.002 0 1.104-.895 2-2 2z" />
                                  </svg>
                                  <Input
                                    id="digitalPublicKey"
                                    type="text"
                                    onChange={digitalSignatureChange}
                                    name="digitalSignaturePublicKey"
                                    className="flex-1 bg-gray-700 text-white border-gray-600 pl-10 text-lg" // Adjust padding for icon space
                                    placeholder="Public key"
                                  />
                                </div>

                                <div className="relative w-full">
                                  <svg
                                    width="20px"
                                    height="20px"
                                    viewBox="0 0 28 28"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                                    fill="#FFFF"
                                  >
                                    <g fill="none" fillRule="evenodd">
                                      <g fill="#FFF" fillRule="nonzero">
                                        <path d="M16.4798956,21.0019578 L16.75,21 C17.9702352,21 18.6112441,21.5058032 19.4020627,22.7041662 L19.7958278,23.3124409 C20.1028266,23.766938 20.2944374,23.9573247 20.535784,24.0567929 C20.9684873,24.2351266 21.3271008,24.1474446 22.6440782,23.5133213 L23.0473273,23.3170319 C23.8709982,22.9126711 24.4330286,22.6811606 25.0680983,22.5223931 C25.4699445,22.4219316 25.8771453,22.6662521 25.9776069,23.0680983 C26.0780684,23.4699445 25.8337479,23.8771453 25.4319017,23.9776069 C25.0371606,24.0762922 24.6589465,24.2178819 24.1641364,24.4458997 L23.0054899,25.0032673 C21.4376302,25.7436944 20.9059009,25.8317321 19.964216,25.4436275 C19.3391237,25.1860028 18.9836765,24.813298 18.4635639,24.0180227 L18.2688903,23.7140849 C17.6669841,22.7656437 17.3640608,22.5 16.75,22.5 L16.5912946,22.5037584 C16.1581568,22.5299816 15.8777212,22.7284469 14.009281,24.1150241 C12.2670395,25.4079488 10.9383359,26.0254984 9.24864243,26.0254984 C7.18872869,26.0254984 5.24773367,25.647067 3.43145875,24.8905363 L6.31377803,24.2241784 C7.25769404,24.4250762 8.23567143,24.5254984 9.24864243,24.5254984 C10.5393035,24.5254984 11.609129,24.0282691 13.1153796,22.9104743 L14.275444,22.0545488 C15.5468065,21.1304903 15.8296113,21.016032 16.4798956,21.0019578 L16.4798956,21.0019578 Z M22.7770988,3.22208979 C24.4507223,4.8957133 24.4507566,7.60916079 22.7771889,9.28281324 L21.741655,10.3184475 C22.8936263,11.7199657 22.8521526,13.2053774 21.7811031,14.279556 L18.7800727,17.2805874 L18.7800727,17.2805874 C18.4870374,17.5733384 18.0121637,17.573108 17.7194126,17.2800727 C17.4266616,16.9870374 17.426892,16.5121637 17.7199273,16.2194126 L20.7188969,13.220444 C21.2039571,12.7339668 21.2600021,12.1299983 20.678941,11.3818945 L10.0845437,21.9761011 C9.78635459,22.2743053 9.41036117,22.482705 8.99944703,22.5775313 L2.91864463,23.9807934 C2.37859061,24.1054212 1.89457875,23.6214094 2.0192066,23.0813554 L3.42247794,17.0005129 C3.51729557,16.5896365 3.72566589,16.2136736 4.0238276,15.9154968 L16.7165019,3.22217992 C18.3900415,1.54855555 21.1034349,1.54851059 22.7770988,3.22208979 Z"></path>
                                      </g>
                                    </g>
                                  </svg>

                                  <Input
                                    id="digitalSignature"
                                    type="text"
                                    onChange={digitalSignatureChange}
                                    name="digitalSignature"
                                    className="flex-1 bg-gray-700 text-white border-gray-600 text-lg pl-12" // Adjust padding for icon space
                                    placeholder="Signature"
                                  />
                                </div>
                              </div>

                              <div className="relative flex items-center w-full">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 4v16h12V8.5L13.5 4H6zm7 1.5V8h3.5L13 5.5zM9 13h6m-6 3h6"
                                  />
                                </svg>

                                <Input
                                  type="file"
                                  className="flex-1 bg-gray-700 text-white border border-gray-600 text-lg pl-10 py-2 pt-1 rounded-md"
                                  onChange={handleFileUpload}
                                  placeholder="Upload file"
                                />

                                <Button
                                  className={
                                    buttonStates[campaign.campaignId]?.color ? `${buttonStates[campaign.campaignId]?.color} text-lg` :
                                      "bg-blue-500 text-lg"
                                  }
                                  onClick={() =>
                                    verifyFileSignature(campaign.campaignId)
                                  }
                                >
                                  {buttonStates[campaign.campaignId]?.text ||
                                    "Verify"}
                                </Button>
                              </div>
                            </div>

                          }
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button
                              onClick={() => handleApproveAndReject(true, campaign.campaignId, campaign.creatorId, campaign.title)}
                              className="bg-green-500 hover:bg-green-600 text-white text-lg"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleApproveAndReject(false, campaign.campaignId, campaign.creatorId, campaign.title)}
                              className="bg-red-500 hover:bg-red-600 text-white text-lg"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
          }
        </div>
      </div>
      <Dialog open={showDescription} onOpenChange={setShowDescription}>
        <DialogContent className="bg-gray-800 text-gray-300">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[60vh]">
            <p>{selectedCampaign?.description}</p>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignList;
