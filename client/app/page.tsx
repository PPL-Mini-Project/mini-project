"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  WalletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PenIcon,
  CalendarIcon,
  CoinsIcon,
  FileTextIcon,
  SendIcon,
  ExternalLink,
  Bell,
} from "lucide-react";
import Image from "next/image";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import HeroImage from "@/public/HeroImage.png";
import { storage } from "./firebase";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { getContractProviderOrSigner } from "@/functions/user";
import { subscribeToChannel } from "@/functions/Notifications";
import { sendNotification } from "@/functions/Notifications";
import Navbar from "@/components/custom/Navbar";
import connectToMetaMask from "@/functions/connectToMetaMask";
import { useQueryClient } from "@tanstack/react-query";
import { uploadFiles } from "@/functions/ipfs";
import { useStorageUpload } from "@thirdweb-dev/react"

export default function Page() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [address, setAddress] = useState("");
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    story: "",
    startDate: "",
    endDate: "",
    amount: 0,
    files: [],
  });
  const [newFiles, setNewFiles] = useState<FileList>();
  const createCampaign = useRef();
  const [campaigns, setCampaign] = useState([]);
  const router = useRouter();

  const { mutateAsync: upload } = useStorageUpload();


  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(campaigns.length / 2));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(campaigns.length / 2)) % Math.ceil(campaigns.length / 2));
  };

  async function connectMask() {
    try {
      const { account, campaigns } = await connectToMetaMask();
      console.log(account,campaigns);
      console.log(account);
      
      setAddress(account);
      setCampaign(campaigns);
    } catch (error) {
      console.error(error.message);
    }
  }

  function scrollToCreateCampaign() {
    createCampaign.current.scrollIntoView();
  }

  async function createNewCampaign() {
    const Contract = await getContractProviderOrSigner("signer");
    // let data = await uploadFiles(newFiles,upload);
    let data = [];
    console.log(data);
    
    try {
      console.log(address);
      
      const user = await Contract.getFundRaiserDetails(address);
      console.log(user);
      
      let auditors = 0;
      if(user.exists === false){
        auditors = Math.ceil((10 * (1 + (50 / 100) ) * Number(newCampaign.amount)) / 100);
      }
      else{
        auditors = Math.ceil((10 * (1 + (user.risk._hex / 100) ) * Number(newCampaign.amount)) / 100);
      }

      console.log(auditors);
      

      await Contract.createCampaign(
        newCampaign.title,
        newCampaign.story,
        new Date().toString(),
        newCampaign.endDate,
        data,
        Number(newCampaign.amount),
        Number(auditors)
      );
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    connectMask();
  }, []);

  console.log(campaigns);
  console.log(address);
  
  

  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar />

      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <section className="flex flex-col my-32 mx-8 md:flex-row justify-center items-center gap-8">
          <div className="flex flex-col w-full md:w-1/2 space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-white">
              CrowdCare: Empowering Health & Education
            </h1>
            <p className="text-xl text-gray-300">
              Join our decentralized platform to fund critical medical
              treatments and educational initiatives. Together, we can make a
              difference in people's lives.
            </p>
            <Button
              size="lg"
              className="w-full md:w-2/5 flex gap-4 bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              onClick={scrollToCreateCampaign}
            >
              Create your campaign
              <ExternalLink />
            </Button>
          </div>
          <div className="w-full md:w-1/2 flex justify-center relative mt-8 md:mt-0">
            <Image
              src={HeroImage}
              width={400}
              height={300}
              alt="Medical and Educational Funding Illustration"
              className="rounded-lg"
            />
          </div>
        </section>

        {/* Blockchain Divider */}
        <div className="relative py-8">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-gray-900 px-4 flex items-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-green-400 rounded-sm animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Campaigns Carousel */}
        <section className="relative px-4">
          <h2 className="text-3xl font-bold text-white mb-6">
            Current Campaigns
          </h2>

          {address === "" ? (
            <Button
              className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              onClick={connectMask}
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect to MetaMask
            </Button>
          ) : (
            <div className="flex items-center justify-center">
              <Button
                onClick={prevSlide}
                variant="outline"
                size="icon"
                className="mr-4 bg-gray-800 text-green-400 border-green-400 hover:bg-green-400 hover:text-gray-900"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <div className="overflow-hidden w-1/3">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {campaigns.map((campaign, i) => (
                    <Card
                      key={i}
                      className="flex-shrink-0 w-full bg-gray-800 border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20"
                    >
                      <img
                        src={campaign.documents[0]}
                        width={400}
                        height={200}
                        alt={campaign.title}
                        className="w-full h-48 object-cover"
                      />
                      <CardHeader>
                        <CardTitle className="text-white">
                          {campaign.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4">
                          End Date: {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                        <Button
                          onClick={() => {
                            router.push(`/campaign/${i}`);
                          }}
                          className="w-full mt-4 bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-md shadow-green-400/30 transition-all duration-300"
                        >
                          Support
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <Button
                onClick={nextSlide}
                variant="outline"
                size="icon"
                className="ml-4 bg-gray-800 text-green-400 border-green-400 hover:bg-green-400 hover:text-gray-900"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Create Campaign Form */}
        <section
          className="bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-lg p-8 shadow-lg"
          ref={createCampaign}
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Create your own Campaign
          </h2>
          <div className="flex items-center">
            <div className="flex-1 text-right pr-4">
              <label htmlFor="title" className="text-green-400 font-semibold">
                Title
              </label>
            </div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <PenIcon className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 pl-4">
              <Input
                id="title"
                className="bg-gray-700 text-white border-gray-600"
                onChange={(evt) => {
                  setNewCampaign((prev) => ({
                    ...prev,
                    title: evt.target.value,
                  }));
                }}
              />
            </div>
          </div>
          <div className="border-l-2 border-dashed border-green-400 ml-[50%] pl-4 py-4">
            <label
              htmlFor="description"
              className="text-green-400 font-semibold block mb-2"
            >
              Description/Story
            </label>
            <Textarea
              id="description"
              className="bg-gray-700 text-white border-gray-600"
              rows={4}
              onChange={(evt) => {
                setNewCampaign((prev) => ({
                  ...prev,
                  story: evt.target.value,
                }));
              }}
            />
          </div>
          <div className="flex items-center">
            <div className="flex-1 text-right pr-4">
              <label htmlFor="endDate" className="text-green-400 font-semibold">
                End Date
              </label>
            </div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 pl-4">
              <Input
                id="endDate"
                type="date"
                className="bg-gray-700 text-white border-gray-600"
                onChange={(evt) => {
                  setNewCampaign((prev) => ({
                    ...prev,
                    endDate: evt.target.value,
                  }));
                }}
              />
            </div>
          </div>
          <div className="border-l-2 border-dashed border-green-400 ml-[50%] pl-4 py-4">
            <label
              htmlFor="goal"
              className="text-green-400 font-semibold block mb-2"
            >
              Goal Amount (ETH)
            </label>
            <Input
              id="goal"
              type="number"
              step="1"
              className="bg-gray-700 text-white border-gray-600"
              min={10}
              onChange={(evt) => {
                setNewCampaign((prev) => ({
                  ...prev,
                  amount: Number(evt.target.value),
                }));
              }}
            />
          </div>
          <div className="flex items-center">
            <div className="flex-1 text-right pr-4">
              <label className="text-green-400 font-semibold">Images & Documents</label>
            </div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <FileTextIcon className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 pl-4">
              <Input
                type="file"
                multiple
                accept="image/*"
                className="bg-gray-700 text-white border-gray-600"
                onChange={(evt) => {
                  setNewFiles(evt.target.files);
                }}
              />
            </div>
          </div>
          <div className="flex justify-center">
            {address != "" ? (
              <Button
                size="lg"
                className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300 mt-10"
                onClick={createNewCampaign}
              >
                <SendIcon className="w-4 h-4 mr-2" />
                Submit Campaign Request
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
                onClick={connectMask}
              >
                <WalletIcon className="w-4 h-4 mr-2" />
                Connect to MetaMask
              </Button>
            )}
          </div>
        </section>

        {/* Platform Impact */}
        <section className="bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Platform Impact
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Total Funds Raised", value: "10,000 ETH" },
              { title: "Lives Impacted", value:  "50,000+" },
              { title: "Successful Campaigns", value: "1,234" },
            ].map((stat, i) => (
              <Card
                key={i}
                className="bg-gray-700 bg-opacity-50 backdrop-blur-sm border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20"
              >
                <CardHeader>
                  <CardTitle className="text-gray-200">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold text-green-400">
                    {stat.value}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800 bg-opacity-70 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2023 CrowdCare. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-green-400 hover:underline transition-colors duration-300"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-green-400 hover:underline transition-colors duration-300"
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1a202c;
        }
        ::-webkit-scrollbar-thumb {
          background: #48bb78;
          border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgba(72, 187, 120, 0.5);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #38a169;
        }
      `}</style>
    </div>
  );
}