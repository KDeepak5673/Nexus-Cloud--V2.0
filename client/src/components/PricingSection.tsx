"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import SubscriptionModal from "./SubscriptionModal";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter (Free)",
    price: "$0",
    period: "/month",
    description: "Best for students & personal projects",
    features: [
      "Deploy up to 5 projects",
      "500 build minutes / month",
      "1 GB storage",
      "5 GB bandwidth / month",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Best for developers & freelancers",
    features: [
      "Deploy up to 50 projects",
      "5000 build minutes / month",
      "20 GB storage",
      "100 GB bandwidth / month",
    ],
    popular: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "Best for startups & teams",
    features: [
      "Deploy up to 200 projects",
      "20,000 build minutes / month",
      "100 GB storage",
      "500 GB bandwidth / month",
    ],
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleUpgradeClick = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleConfirmPayment = async (plan: Plan) => {
    // Integrate with your payment gateway here
    console.log("Confirming payment for:", plan);
    // Example: Call your API to initiate payment
    // const response = await api.post('/payments/initiate', { planName: plan.name });
  };

  const handleCloseModal = () => {
    setSelectedPlan(null);
  };

  return (
    <section ref={ref} aria-labelledby="pricing-heading" className="pricing-page-wrapper">
      <div className="pricing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="pricing-intro"
        >
          <h2 id="pricing-heading">Upgrade your plan</h2>
          <p>Choose the plan that suits your needs</p>
        </motion.div>

        

        <div className="pricing-grid">
          {plans.map((plan, index) => {
            const popular = plan.popular;
            return (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.45, delay: index * 0.06 }} whileHover={{ scale: 1.02 }}>
                <Card className={cn('pricing-card', popular ? 'popular' : '')} role="article" aria-label={`${plan.name} plan`}> 
                  <div className="pricing-card-header">
                    <h3 className="pricing-card-title">{plan.name}</h3>
                    <div className="pricing-card-price">{plan.price} <span className="muted">{plan.period}</span></div>
                    <div className="pricing-card-desc muted">{plan.description}</div>
                  </div>

                  <CardContent>
                    <ul className="pricing-features" role="list" aria-label={`${plan.name} plan features`}>
                      {plan.features.map((feature) => (
                        <li key={feature} className="pricing-feature"><span className="dot">✓</span><span>{feature}</span></li>
                      ))}
                    </ul>

                    <div className="pricing-cta">
                      <button 
                        className={`btn-modern ${popular ? 'btn-primary' : 'btn-outline'}`} 
                        aria-label={`Upgrade to ${plan.name}`}
                        onClick={() => handleUpgradeClick(plan)}
                      >
                        {plan.name === 'Enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        plan={selectedPlan} 
        onClose={handleCloseModal}
        onConfirm={handleConfirmPayment}
      />
    </section>
  );
}

export default PricingSection;
