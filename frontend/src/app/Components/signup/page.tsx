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
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  async function onSignup(event: React.FormEvent) {
    event.preventDefault();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (user.password !== user.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!/^\d{10}$/.test(user.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const response = await axios.post(`${baseUrl}/api/auth/signup`, user);

      if (response.status === 201) {
        const token = response.data.token;
        login(token);
        router.push("/");
      }
    } catch (err) {
      alert("Signup failed. Please try again.");
    }
  }

  const isFormValid =
    user.name &&
    user.email &&
    user.password &&
    user.confirmPassword &&
    user.password === user.confirmPassword &&
    /^\d{10}$/.test(user.phone);

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#ffffff] mt-10">
      <div className="bg-white/30 backdrop-blur-lg text-black border border-gray-300 rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <form onSubmit={onSignup}>
          <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>
          <hr className="mb-4 border-gray-400" />

          <div className="flex flex-col">
            <label htmlFor="username" className="font-bold mb-1">Username</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              id="username"
              className="bg-white/50 text-black rounded px-3 py-2 mb-4 border border-gray-400 placeholder:text-gray-600"
              placeholder="Enter your username"
            />

            <label htmlFor="email" className="font-bold mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              id="email"
              className="bg-white/50 text-black rounded px-3 py-2 mb-4 border border-gray-400 placeholder:text-gray-600"
              placeholder="Enter your email"
            />

            <label htmlFor="number" className="font-bold mb-1">Number</label>
            <input
              type="text"
              value={user.phone}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              id="number"
              className="bg-white/50 text-black rounded px-3 py-2 mb-4 border border-gray-400 placeholder:text-gray-600"
              placeholder="Enter your number"
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

            <label htmlFor="confirmPassword" className="font-bold mb-1">Confirm Password</label>
            <input
              type="password"
              value={user.confirmPassword}
              onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
              id="confirmPassword"
              className="bg-white/50 text-black rounded px-3 py-2 mb-4 border border-gray-400 placeholder:text-gray-600"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-2 rounded transition mb-4 ${
              !isFormValid
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-blue-600"
            }`}
          >
            Sign Up
          </button>

          <p className="text-center text-sm text-gray-700">
            Already have an account?{" "}
            <Link href="/Components/signin" className="text-blue-700 hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
