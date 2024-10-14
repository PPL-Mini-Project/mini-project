import Image from "next/image";
import { Button } from "@/components/ui/button";
import { WalletIcon, Bell } from "lucide-react";
import Logo from "@/public/Logo.png";
import { useRouter } from "next/navigation";
import connectToMetaMask from "@/functions/connectToMetaMask";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query to fetch the connected MetaMask account
  const { data: address } = useQuery({
    queryKey: ["ethAccount"], // Query key for the Ethereum account
    queryFn: async () => {
      const { account } = await connectToMetaMask();
      return account ? account[0] : ""; // Return the first Ethereum account or an empty string
    },
    enabled: false, // Prevent automatic fetching on mount
  });

  // Function to connect MetaMask and fetch the address
  async function connectMask() {
    try {
      const { account } = await connectToMetaMask(); // Connect to MetaMask
      queryClient.setQueryData(["ethAccount"], account); // Update query data manually with the full account
      return account; // Return account for display
    } catch (error) {
      console.error(error.message);
    }
  }

  // Using useEffect to connect to MetaMask on component mount
  useEffect(() => {
    const fetchAccount = async () => {
      const account = await connectMask(); // Call connectMask
      queryClient.setQueryData(["ethAccount"], account); // Set account in query data
    };

    fetchAccount(); // Call the inner async function
  }, [queryClient]); // Add queryClient as a dependency

  return (
    <div className="w-screen">
      <nav className="bg-gray-900  backdrop-blur-md border-b border-gray-700 py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4" onClick={() => router.push(`/`)}>
            <Image
              src={Logo}
              width={40}
              height={40}
              alt="CrowdCare Logo"
              className="rounded-full"
            />
            <span className="text-xl font-bold text-white">CrowdCare</span>
          </div>

          {address ? (
            <div className="flex items-center">
              <Button
                className="bg-transparent hover:bg-transparent font-extrabold transition-all duration-300 mr-4"
                onClick={() => router.push(`/notifications`)}
              >
                <Bell className="w-5 h-5 text-green-400 hover:text-green-400 hover:scale-125" />
              </Button>
              <Button className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300 mr-4">
                <WalletIcon className="w-4 h-4 mr-2" />
                <p>{address}</p> 
              </Button>
            </div>
          ) : (
            <Button
              className="bg-green-400 hover:bg-green-300 text-gray-900 font-semibold shadow-lg shadow-green-400/50 transition-all duration-300 mr-4"
              onClick={connectMask} // Connect MetaMask when clicked
            >
              <WalletIcon className="w-4 h-4 mr-2" />
              Connect to MetaMask
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}
