"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Cloud,
  Github,
  Globe,
  Zap,
  Users,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Cloudify",
    description: "Let's get you set up in just a few steps",
  },
  {
    id: "connect",
    title: "Connect your Git provider",
    description: "Import projects directly from your repositories",
  },
  {
    id: "team",
    title: "Set up your team",
    description: "Collaborate with your teammates on projects",
  },
  {
    id: "complete",
    title: "You're all set!",
    description: "Start deploying your first project",
  },
];

const gitProviders = [
  { name: "GitHub", icon: Github, connected: false },
  { name: "GitLab", icon: Globe, connected: false },
  { name: "Bitbucket", icon: Cloud, connected: false },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [connectedProvider, setConnectedProvider] = useState<string | null>(null);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const connectProvider = (provider: string) => {
    // Simulate OAuth connection
    setConnectedProvider(provider);
    setTimeout(() => nextStep(), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20rem] left-1/2 -translate-x-1/2">
          <div className="h-[40rem] w-[40rem] rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl" />
        </div>
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-16">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
              <Cloud className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Cloudify
            </span>
          </Link>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-8 bg-blue-600"
                  : index < currentStep
                  ? "w-2 bg-blue-600"
                  : "w-2 bg-gray-300 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gray-200 dark:border-gray-800 shadow-xl">
              <CardContent className="p-8">
                {/* Step 0: Welcome */}
                {currentStep === 0 && (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
                      <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      {steps[currentStep].description}
                    </p>
                    <div className="space-y-4 text-left">
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Deploy in seconds
                          </h3>
                          <p className="text-sm text-gray-500">
                            Push to deploy with zero configuration
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Global edge network
                          </h3>
                          <p className="text-sm text-gray-500">
                            Your site is fast everywhere
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Collaborate with your team
                          </h3>
                          <p className="text-sm text-gray-500">
                            Preview deployments for every PR
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
                      className="mt-8 w-full"
                      onClick={nextStep}
                    >
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Step 1: Connect Git */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                      {steps[currentStep].description}
                    </p>
                    <div className="space-y-3">
                      {gitProviders.map((provider) => (
                        <button
                          key={provider.name}
                          onClick={() => connectProvider(provider.name)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-lg border transition-colors",
                            connectedProvider === provider.name
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <provider.icon className="h-6 w-6" />
                            <span className="font-medium">
                              Continue with {provider.name}
                            </span>
                          </div>
                          {connectedProvider === provider.name && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={nextStep}
                      className="mt-6 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mx-auto block"
                    >
                      Skip for now
                    </button>
                  </div>
                )}

                {/* Step 2: Team setup */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                      {steps[currentStep].description}
                    </p>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Team Name
                        </label>
                        <Input
                          placeholder="My Team"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Invite Team Members (optional)
                        </label>
                        <Input
                          placeholder="email1@example.com, email2@example.com"
                          value={inviteEmails}
                          onChange={(e) => setInviteEmails(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Separate multiple emails with commas
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                      <Button variant="outline" onClick={prevStep}>
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={nextStep}
                      >
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Complete */}
                {currentStep === 3 && (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                      <Rocket className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      {steps[currentStep].description}
                    </p>
                    <div className="space-y-4">
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        asChild
                      >
                        <Link href="/new">
                          <Zap className="h-5 w-5" />
                          Deploy Your First Project
                        </Link>
                      </Button>
                      <Button variant="outline" size="lg" className="w-full" asChild>
                        <Link href="/dashboard">
                          Go to Dashboard
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
