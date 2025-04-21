"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { FaHistory } from "react-icons/fa";
import { useHistory } from "../context/historyContext";
import { useAuth } from "../context/authContext";

export default function Navbar() {
  const router = useRouter();
  const { isLoggedin, logout } = useAuth();
  const { showHistory, setShowHistory } = useHistory(); 

  const handleLogout = () => {
    logout();
    router.push("/Components/signin");
  };

  return (
    <div className="relative">
      <div
        className={`fixed top-0 left-0 w-full z-10 bg-[#f7f7f8] shadow-md py-4`}
      >
        <div className="w-[90%] mx-auto flex justify-between items-center text-white">

          <div
            className="text-2xl text-gray-400 cursor-pointer hover:text-gray-900"
            onClick={() => setShowHistory(!showHistory)}
          >
            <FaHistory />
          </div>


          <div
            className="text-black text-2xl font-semibold cursor-pointer"
            onClick={() => router.push("/")}
          >
            GrowStack
          </div>


          <div className="flex gap-6 items-center">
            {isLoggedin ? (
              <div
                className="bg-[#f7f7f8] text-black px-4 py-2 rounded-full cursor-pointer hover:bg-gray-600 hover:text-white"
                onClick={handleLogout}
              >
                Logout
              </div>
            ) : (
              <>
                <div
                  className="bg-[#f7f7f8] text-black px-4 py-2 rounded-full cursor-pointer hover:bg-gray-600 hover:text-white"
                  onClick={() => router.push("/Components/signin")}
                >
                  Sign In
                </div>
                <div
                  className="bg-[#f7f7f8] text-black px-4 py-2 rounded-full cursor-pointer hover:bg-gray-600 hover:text-white"
                  onClick={() => router.push("/Components/signup")}
                >
                  Sign Up
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
