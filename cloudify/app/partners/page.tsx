"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Code2,
  Rocket,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const partnerTypes = [
  {
    name: "Technology Partners",
    description: "Integrate your product with Cloudify and reach millions of developers",
    icon: Code2,
    color: "from-gray-600 to-gray-400",
    benefits: [
      "Integration support and documentation",
      "Co-marketing opportunities",
      "Early access to new features",
      "Partner directory listing",
    ],
  },
  {
    name: "Agency Partners",
    description: "Build and deploy client projects faster with Cloudify",
    icon: Rocket,
    color: "from-purple-500 to-pink-500",
    benefits: [
      "Dedicated partner manager",
      "Volume discounts",
      "Training and certification",
      "Lead referral program",
    ],
  },
  {
    name: "Enterprise Partners",
    description: "Strategic partnerships for large-scale deployments",
    icon: Building2,
    color: "from-orange-500 to-amber-500",
    benefits: [
      "Custom SLAs and support",
      "White-label solutions",
      "Revenue sharing",
      "Executive sponsorship",
    ],
  },
];

const partnerBenefits = [
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Access new markets and customers through the Cloudify ecosystem",
  },
  {
    icon: Users,
    title: "Dedicated Support",
    description: "Get priority access to our partner success team",
  },
  {
    icon: Award,
    title: "Recognition",
    description: "Get featured in our partner directory and marketing materials",
  },
];

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Badge className="mb-4" variant="secondary">
                Partner Program
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Grow Together with Cloudify
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Join our partner ecosystem and unlock new opportunities for your business.
                Whether you're a technology vendor, agency, or enterprise, we have a program for you.
              </p>
              <div className="mt-8">
                <Button size="lg" asChild>
                  <Link href="/contact">Become a Partner</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Partner Benefits Overview */}
        <section className="py-12 -mt-8">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {partnerBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center mb-4">
                        <benefit.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-16">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Partner Programs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {partnerTypes.map((type, index) => (
                <motion.div
                  key={type.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${type.color}`} />
                  <div className="p-6">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${type.color} mb-4`}
                    >
                      <type.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {type.name}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {type.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {type.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/contact">
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-background">
              Ready to Partner with Us?
            </h2>
            <p className="mt-4 text-xl text-background/70 max-w-2xl mx-auto">
              Fill out the form and our partnerships team will get in touch within 48 hours.
            </p>
            <div className="mt-8">
              <Button size="lg" variant="secondary" className="bg-background text-foreground" asChild>
                <Link href="/contact">Apply Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
