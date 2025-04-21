"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "../../context/authContext";

export default function Page() {
  const router = useRouter();
  const { login } = useAuth();

  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  async function onSignin(event: React.FormEvent) {
    event.preventDefault();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      const response = await axios.post(`${baseUrl}/api/auth/login`, user);

      if (response.status === 200) {
        const token = response.data.token;
        login(token);

        try {
          const idResponse = await axios.post(`${baseUrl}/api/chat/start`, {}, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          sessionStorage.setItem("chatId", idResponse.data.chatId);
        } catch (err) {
          console.log(err);
        }

        router.push("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Invalid credentials. Please try again.");
    }
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#ffffff]">
      <div className="bg-white/30 backdrop-blur-lg text-black border border-gray-300 rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <form onSubmit={onSignin}>
          <h2 className="text-2xl font-bold text-center mb-4">Sign In</h2>
          <hr className="mb-4 border-gray-400" />

          <div className="flex flex-col">
            <label htmlFor="email" className="font-bold mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              id="email"
              className="bg-white/50 text-black rounded px-3 py-2 mb-4 border border-gray-400 placeholder:text-gray-600"
              placeholder="Enter your email"
            />

            <label htmlFor="password" className="font-bold mb-1">Password</label>
            <input
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              id="password"
              className="bg-white/50 text-black rounded px-3 py-2 mb-4 border border-gray-400 placeholder:text-gray-600"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={!user.email || !user.password}
            className={`w-full py-2 rounded transition mb-4 
              ${!user.email || !user.password
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-blue-600"}
            `}
          >
            Sign In
          </button>

          <p className="text-center text-sm text-gray-700">
            Don’t have an account?{" "}
            <Link href="/Components/signup" className="text-blue-700 hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
