"use client";

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { WalletIcon, ChevronLeftIcon, ChevronRightIcon, PenIcon, CalendarIcon, CoinsIcon, FileTextIcon, SendIcon, ExternalLink } from "lucide-react"
import Image from "next/image";
import { ethers } from "ethers";
// Routing
import { useRouter } from 'next/navigation';

import HeroImage from "@/public/HeroImage.png"
import Logo from "@/public/Logo.png"

// import ThirdWebStorage from "@thirdweb-dev/storage";
// import {useStorageUpload} from "@thirdweb-dev/react";

import { storage } from "./firebase";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";

// Contract Address
import { getContractProviderOrSigner } from '@/functions/user';

import { subscribeToChannel } from '@/functions/Notifications';
import { sendNotification } from '@/functions/Notifications';

export default function Page() {

  // const client = createThirdwebClient({
  //   clientId: "544a63bd14ad456d64c742ff0ec281d3",
  // });

  // console.log(client);



  const [currentSlide, setCurrentSlide] = useState(0);

  // User Wallet Address
  const [address, setAddress] = useState("");

  // Store New Campaign Details
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    story: "",
    startDate: "",
    endDate: "",
    amount: 0,
    files: []
  });

  const [newFiles, setNewFiles] = useState<FileList>();

  // Ref for form
  const createCampaign = useRef();

  // Stores all curent campaigns
  const [campaigns, setCampaign] = useState([]);

  const router = useRouter();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % campaigns.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + campaigns.length) % campaigns.length)
  }

  // Get all the current campaigns
  async function getAllCampaigns() {
    const Contract = await getContractProviderOrSigner("provider");
    return await Contract.getAllCampaigns();
  }

  // Connect to meta mask account
  async function connectMask() {
    try {
      if (window.ethereum) {

        const acc = await window.ethereum.request({
          method: "eth_requestAccounts"
        });

        setAddress(acc[0]);
        setCampaign(await getAllCampaigns());
      }
      else {
        console.error(
          'MetaMask not found. Please install MetaMask to use this application.',
        );
      }
    }
    catch (error) {
      console.error(error);
    }
  }


  // Scroll to form
  function scrollToCreateCampaign() {
    createCampaign.current.scrollIntoView();
  }

  // Upload files
  async function uploadFiles() {
    // const authorization = "Basic " + btoa("5f6c4e60ddcb44f392bff86d47a61821" + ":" + "UKSF7O2AXL7R194gyA8yhL3FZp2hVc/R8arCWl/nWd+vezXnP7e7cQ");
    // const ipfs = create({
    //   url: "https://ipfs.infura.io:5001/api/v0",
    //   headers: {
    //     authorization,
    //   },
    // });
    // console.log(ipfs);
    // console.log(newCampaign);

    // for (let i = 0; i < newCampaign.files.length; i++) {
    //   const added = await ipfs.add(newCampaign.files[i]);
    //   console.log(added);

    //   console.log(
    //     `https://ipfs.infura.io/ipfs/${added.path}`
    //   );
    // };

    let data = newCampaign;
    data.files = [];

    console.log(newCampaign.files);


    for (let i = 0; i < newFiles.length; i++) {
      console.log(newFiles[i]);

      const storageRef = ref(
        storage,
        newFiles[i].name
      );
      await uploadBytes(storageRef, newFiles[i]);
      const res = await getDownloadURL(
        ref(
          storage,
          newFiles[i].name
        )
      );
      console.log(res);

      data.files.push(res);
    }
    console.log(data);

    return data;
  }

  // Create Campaign
  async function createNewCampaign() {

    const Contract = await getContractProviderOrSigner("signer");
    let data = await uploadFiles();
    try {
      await Contract.createCampaign(newCampaign.title, newCampaign.story, new Date().toString(), newCampaign.endDate, data.files, Number(newCampaign.amount));
    }
    catch (e) {
      console.log(e);
    }

  }

  useEffect(() => {
    connectMask();
  }, [])

  return (
    <div className="h-fit max-w-[99%] bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Navbar */}
      <nav className="bg-gray-900 bg-opacity-70 backdrop-blur-md border-b border-gray-700 py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image
              src={Logo}
              width={40}
              height={40}
              alt="CrowdCare Logo"
              className="rounded-full"
            />
            <span className="text-xl font-bold text-white">CrowdCare</span>
          </div>
          {address === "" ?
            <Button className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              onClick={connectMask}>
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect to MetaMask
            </Button>
            :
            <Button className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300">
              <WalletIcon className="w-4 h-4 mr-2" />
              {address}
            </Button>
          }
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <section className="flex flex-col my-32 mx-8 md:flex-row justify-center items-center gap-8">
          <div className="flex flex-col w-1/2 space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-white">
              CrowdCare: Empowering Health & Education
            </h1>
            <p className="text-xl text-gray-300">
              Join our decentralized platform to fund critical medical treatments and educational initiatives. Together, we can make a difference in people's lives.
            </p>
            <Button size="lg" className="w-2/5 flex gap-4 bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              onClick={scrollToCreateCampaign}>
              Create your campaign
              <ExternalLink />
            </Button>
          </div>
          <div className="w-1/2 flex justify-center relative">
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
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-gray-900 px-4 flex items-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-green-400 rounded-sm animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Campaigns Carousel */}
        <section className="relative px-4">
          <h2 className="text-3xl font-bold text-white mb-6">Current Campaigns</h2>

          {address === "" ?
            <Button className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
              onClick={connectMask}>
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect to MetaMask
            </Button>
            :
            <div className="flex items-center">
              <Button onClick={prevSlide} variant="outline" size="icon" className="absolute left-0 z-10 bg-gray-800 text-green-400 border-green-400 hover:bg-green-400 hover:text-gray-900">
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <div className="overflow-hidden w-full">
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {campaigns.map((campaign, i) => (
                    <Card key={i} className="flex-shrink-0 w-full bg-gray-800 border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20">
                      {/* <Image
                        src={`/placeholder.svg?height=200&width=400&text=${campaign.type}+Campaign`}
                        width={400}
                        height={200}
                        alt={campaign.title}
                        className="w-full h-48 object-cover"
                      /> */}
                      <CardHeader>
                        <CardTitle className="text-white">{campaign.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 mb-4">{campaign.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-green-400 font-semibold">{Number(ethers.utils.formatEther(campaign.amountRaised)) * 1000000000000000000} WEI / {Number(ethers.utils.formatEther(campaign.fundingGoal)) * 1000000000000000000} WEI</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-green-400 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${(Number(ethers.utils.formatEther(campaign.amountRaised)) / Number(ethers.utils.formatEther(campaign.fundingGoal))) * 100}%` }}></div>
                          </div>
                        </div>
                        <Button onClick={() => { router.push(`/campaign/${i}`) }} className="w-full mt-4 bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-md shadow-green-400/30 transition-all duration-300">Support</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <Button onClick={nextSlide} variant="outline" size="icon" className="absolute right-0 z-10 bg-gray-800 text-green-400 border-green-400 hover:bg-green-400 hover:text-gray-900">
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          }
        </section>

        {/* Stats Section */}
        <section className="bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Platform Impact</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Total Funds Raised", value: "10,000 ETH" },
              { title: "Lives Impacted", value: "50,000+" },
              { title: "Successful Campaigns", value: "1,234" }
            ].map((stat, i) => (
              <Card key={i} className="bg-gray-700 bg-opacity-50 backdrop-blur-sm border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/20">
                <CardHeader>
                  <CardTitle className="text-gray-200">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold text-green-400">{stat.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Create Campaign Form */}
        <section className="bg-gray-800 bg-opacity-70 backdrop-blur-md rounded-lg p-8 shadow-lg" ref={createCampaign}>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Create your own Campaign</h2>
          <div className="flex items-center">
            <div className="flex-1 text-right pr-4">
              <label htmlFor="title" className="text-green-400 font-semibold">Title</label>
            </div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <PenIcon className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 pl-4">
              <Input id="title" className="bg-gray-700 text-white border-gray-600" onChange={(evt) => { setNewCampaign((prev) => ({ ...prev, title: evt.target.value })) }} />
            </div>
          </div>
          <div className="border-l-2 border-dashed border-green-400 ml-[50%] pl-4 py-4">
            <label htmlFor="description" className="text-green-400 font-semibold block mb-2">Description/Story</label>
            <Textarea id="description" className="bg-gray-700 text-white border-gray-600" rows={4}
              onChange={(evt) => { setNewCampaign((prev) => ({ ...prev, story: evt.target.value })) }}
            />
          </div>
          <div className="flex items-center">
            <div className="flex-1 text-right pr-4">
              <label htmlFor="endDate" className="text-green-400 font-semibold">End Date</label>
            </div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 pl-4">
              <Input id="endDate" type="date" className="bg-gray-700 text-white border-gray-600"
                onChange={(evt) => { setNewCampaign((prev) => ({ ...prev, endDate: evt.target.value })) }} />
            </div>
          </div>
          <div className="border-l-2 border-dashed border-green-400 ml-[50%] pl-4 py-4">
            <label htmlFor="goal" className="text-green-400 font-semibold block mb-2">Goal Amount (ETH)</label>
            <Input id="goal" type="number" step="1" className="bg-gray-700 text-white border-gray-600" min={10}
              onChange={(evt) => { setNewCampaign((prev) => ({ ...prev, amount: Number(evt.target.value) })) }}
            />
          </div>
          <div className="flex items-center">
            <div className="flex-1 text-right pr-4">
              <label className="text-green-400 font-semibold">Documents</label>
            </div>
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <FileTextIcon className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex-1 pl-4">
              <Input type="file" multiple className="bg-gray-700 text-white border-gray-600"
                onChange={(evt) => {
                  console.log(evt.target.files);
                  setNewFiles(evt.target.files);
                }} />
            </div>
          </div>
          {/* <div className="border-l-2 border-dashed border-green-400 ml-[50%] pl-4 py-4">
            <label htmlFor="wallet" className="text-green-400 font-semibold block mb-2">Wallet Address</label>
            <Input id="wallet" className="bg-gray-700 text-white border-gray-600"
              onChange={(evt) => { setNewCampaign((prev) => ({ ...prev, walletAddress: evt.target.value })) }} />
          </div> */}
          <div className="flex justify-center">

            {
              address != "" ?
                <Button size="lg" className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300 mt-10"
                  onClick={createNewCampaign}>
                  <SendIcon className="w-4 h-4 mr-2" />
                  Submit Campaign Request
                </Button>
                :
                <Button size="lg" className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300"
                  onClick={connectMask}>
                  <WalletIcon className="w-4 h-4 mr-2" />
                  Connect to MetaMask
                </Button>
            }

          </div>
        </section>
      </div >

      {/* Footer */}
      < footer className="border-t border-gray-700 bg-gray-800 bg-opacity-70 backdrop-blur-md" >
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2023 CrowdCare. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-400 hover:text-green-400 hover:underline transition-colors duration-300">
              Terms
            </a>
            <a href="#" className="text-sm text-gray-400 hover:text-green-400 hover:underline transition-colors duration-300">
              Privacy
            </a>
          </div>
        </div>
      </footer >
    </div >
  )
}



