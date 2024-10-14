'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getContractProviderOrSigner } from "@/functions/user";
import Navbar from "@/components/custom/Navbar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { BigNumber, ethers } from "ethers";

const CampaignList = () => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [campaignIds, setCampaignIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [mode, setMode] = useState("audit");

  useEffect(() => {
    if (mode === "audit")
      getAuditCampaigns();
    else
      getCampaigns();
  }, []);

  async function getCampaigns() {
    try {
      const Contract = await getContractProviderOrSigner("provider");
      const data = await Contract.getPendingCampaigns();
      console.log(data);
      let camp = [];
      let ids = [];
      for (let i = 0; i < data[0].length; i++) {
        if (data[0][i].title != "") {
          camp.push(data[0][i]);
          ids.push(data[1][i]);
        }
      }
      setCampaigns(camp);
      setCampaignIds(ids);
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
    try {
      const Contract = await getContractProviderOrSigner("provider");
      const data = await Contract.getDonorDetails();
      console.log(data);

      const camp = data[2];
      const status = data[3];

      let campaigns = [];
      let ids = [];
      for (let i = 0; i < camp.length; i++) {
        if (status[i] == 0) {
          campaigns.push(await Contract.getCampaign(camp[i]));
          ids.push(camp[i]);
        }
      }
      setCampaigns(campaigns);
      setCampaignIds(ids);
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

  const handleApprove = async (id) => {
    console.log("Approve campaign", Number(id._hex));
    const Contract = await getContractProviderOrSigner("signer");
    if (mode === "audit") {
      await Contract.auditorResponce(Number(id._hex), 1);
      const status = await Contract.auditStatus(Number(id._hex));
      if (status == 1) {
        const amt = await Contract.getAmountRaised(id);
        await Contract.donateCampaignToUser(id, { value: Number(amt._hex) });
      }
      else if (status == 2) {
        const data = await Contract.getDonors(id);
        const addresses = data[0];
        const amount = data[1];
        for (let i = 0; i < addresses.length; i++)
          await Contract.revertAmount(addresses[i], { value: Number(amount[i]._hex) });
      }
    }
    else {
      // await Contract.updateCampaignStatus(Number(id._hex),1); // 1 - On air
    }
  };

  const handleReject = async (id) => {
    console.log("Reject campaign", id);
    const Contract = await getContractProviderOrSigner("signer");
    if (mode === "audit") {
      await Contract.auditorResponce(Number(id._hex), 2);
      const status = await Contract.auditStatus(Number(id._hex));
      if (status == 1) {
        const amt = await Contract.getAmountRaised(id);
        await Contract.donateCampaignToUser(id, { value: Number(amt._hex) });
      }
      else if (status == 2) {
        const data = await Contract.getDonors(id);
        const addresses = data[0];
        const amount = data[1];
        for (let i = 0; i < addresses.length; i++) {
          let tx = await Contract.revertAmount(addresses[i], { value: Number(amount[i]._hex) });
          await tx.wait();
        }
      }
    }
    else {
      // await Contract.updateCampaignStatus(Number(id._hex),5); // 5 - Reject
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-9xl text-gray-300">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar />
      <div className="flex-grow p-6 text-gray-300 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <h1 className="text-3xl font-bold mb-6">Campaigns for Approval</h1>
          <ScrollArea className="flex-grow">
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                <Card key={campaignIds[index]} className="bg-gray-800 text-gray-300 overflow-hidden">
                  <CardContent className="p-0 flex">
                    <div className="w-1/4 relative">
                      <img
                        src={campaign.documents[0]}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h2 className="text-xl font-semibold">{campaign.title}</h2>
                          <p className="text-sm text-gray-400">Creator: {campaign.creatorId}</p>
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
                          onClick={() => window.open(campaign.documents[0], '_blank')}
                        >
                          View Document(s)
                        </Button>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => handleApprove(campaignIds[index])}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(campaignIds[index])}
                          className="bg-red-500 hover:bg-red-600 text-white"
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