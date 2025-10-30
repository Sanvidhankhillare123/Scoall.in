import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export default function Auth({ mode = "login" }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(mode === "signup");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Logged in successfully!");
    } catch (error) {
      toast.error(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);

      console.log("Attempting signup with:", { email, fullName });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log("Signup result:", { data, error });

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        toast.success("Check your email for the confirmation link!");
      } else if (data.user && data.user.email_confirmed_at) {
        // User signed up and is immediately confirmed
        toast.success(
          "Account created successfully! Please complete your profile."
        );
      } else {
        toast.success("Account created successfully!");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(
        error.error_description || error.message || "Error creating account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          IIT Fest Sports
        </h1>
        <p className="text-center text-slate-300 mb-8">
          {isSignUp ? "Create an account to continue" : "Sign in to continue"}
        </p>

        <form className="space-y-6">
          {isSignUp && (
            <input
              className="w-full bg-slate-900 p-4 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-white placeholder-slate-400"
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <input
            className="w-full bg-slate-900 p-4 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-white placeholder-slate-400"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full bg-slate-900 p-4 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors text-white placeholder-slate-400"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            onClick={isSignUp ? handleSignUp : handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {loading
              ? isSignUp
                ? "Signing Up..."
                : "Signing In..."
              : isSignUp
              ? "Sign Up"
              : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
