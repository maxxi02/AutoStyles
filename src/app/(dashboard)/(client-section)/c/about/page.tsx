"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const AboutPage = () => {

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">About AutoStyles</CardTitle>
            <CardDescription className="text-muted-foreground">
              Revolutionizing car customization with cutting-edge design tools
              and premium services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Our Mission</h3>
              <p className="text-muted-foreground">
                At AutoStyles, we believe every car tells a story. Our mission
                is to empower car enthusiasts to bring their visions to life
                through innovative customization tools, high-quality materials,
                and expert craftsmanship. Founded in 2020, we&apos;ve helped
                thousands of customers transform ordinary vehicles into
                extraordinary expressions of style.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What We Offer</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  • Premium paint colors and finishes (Matte, Glossy, Metallic)
                </li>
                <li>• Custom 2D previews for accurate visualization</li>
                <li>• Seamless online ordering and walk-in services</li>
                <li>• Real-time pricing and discount options</li>
                <li>• Eco-friendly and durable materials</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Badge variant="secondary">10K+</Badge>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">500+</Badge>
                <p className="text-sm text-muted-foreground">Custom Designs</p>
              </div>
              <div className="space-y-2">
                <Badge variant="secondary">5★</Badge>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>

            <div className="text-center">
              <Button asChild>
                <Link href="/c/customization">Start Your Design</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AboutPage;
