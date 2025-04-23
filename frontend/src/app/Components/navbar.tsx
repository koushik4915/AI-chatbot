"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaHistory } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { HiOutlineChevronRight } from "react-icons/hi"; // <-- Import right arrow
import { useHistory } from "../context/historyContext";
import { useAuth } from "../context/authContext";

export default function Navbar() {
  const router = useRouter();
  const { isLoggedin, logout } = useAuth();
  const { showHistory, setShowHistory } = useHistory();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/Components/signin");
  };

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 w-full z-10 bg-[#f7f7f8] shadow-md py-4">
        <div className="w-[90%] mx-auto flex justify-between items-center text-white">
          <div className="flex items-center gap-4 text-gray-400">
            <FaHistory
              className="text-2xl cursor-pointer hover:text-gray-900"
              onClick={() => setShowHistory(!showHistory)}
            />
            <div className="relative">
              <div
                className="flex items-center gap-1 text-md font-medium text-gray-900 cursor-pointer hover:text-gray-900 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors duration-200"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <BsStars className="text-lg text-gray-800" />
                AI Assistant
              </div>
              {dropdownOpen && (
                <div className="absolute top-10 left-0 bg-white shadow-lg rounded-md w-72 text-black py-2 text-md">
                  <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center" onClick={()=>router.push("/Components/story-generator")}>
                    ⁠⁠Kids Idea Story Generator
                    <HiOutlineChevronRight className="text-lg text-gray-500" />
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                    3d Animated Character Generator
                    <HiOutlineChevronRight className="text-lg text-gray-500" />
                  </div>
                  <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                    Song Lyric Designer
                    <HiOutlineChevronRight className="text-lg text-gray-500" />
                  </div>
                </div>
              )}
            </div>
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
