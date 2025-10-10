"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Heart,
  DollarSign,
  Shield,
  Zap,
  Users,
  HelpCircle,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const cars = [
  {
    name: "Mazda Protégé X4",
    price: "$550.00",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    type: "SUV",
  },
  {
    name: "Mustang Sport Car",
    price: "$825.00",
    image:
      "https://images.unsplash.com/photo-1549317661-bd8e8e7b1d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    type: "Sports",
  },
  {
    name: "Ampera Halo GT",
    price: "$650.00",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    type: "Sedan",
  },
  {
    name: "Audi e-tron B8",
    price: "$700.00",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    type: "Sedan",
  },
  {
    name: "Harbour Aurora",
    price: "$925.00",
    image:
      "https://images.unsplash.com/photo-1547753495-2e4d3b3f3b7a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    type: "SUV",
  },
  {
    name: "Veloce Stellaris",
    price: "$875.00",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    type: "SUV",
  },
];

const services = [
  {
    number: "1",
    icon: DollarSign,
    title: "Deals for every budget",
    description:
      "We offer competitive pricing with flexible payment options to make your dream customization affordable and accessible.",
  },
  {
    number: "2",
    icon: Shield,
    title: "Best price guaranteed",
    description:
      "Our price match guarantee ensures you get the best value. If you find a lower price, we'll match it and add a discount.",
  },
  {
    number: "3",
    icon: Zap,
    title: "Fully electric driving",
    description:
      "Specialized services for electric vehicles with eco-friendly paint options and sustainable customization materials.",
  },
  {
    number: "4",
    icon: Users,
    title: "Best experienced team",
    description:
      "Our certified technicians have over 15 years of experience in automotive customization and restoration.",
  },
];

const faqs = [
  {
    question: "What is the customization process?",
    answer:
      "Our process starts with a consultation to understand your vision, followed by design previews, material selection, and professional application. We handle everything from start to finish.",
  },
  {
    question: "How long does a typical customization take?",
    answer:
      "Most projects take 1-2 weeks depending on complexity. We provide a timeline during your initial consultation and keep you updated throughout.",
  },
  {
    question: "What types of vehicles do you customize?",
    answer:
      "We work on all makes and models, including sedans, SUVs, sports cars, and classics. From daily drivers to luxury vehicles, we've got you covered.",
  },
  {
    question: "Do you offer a warranty on your work?",
    answer:
      "Yes! All customizations come with a 2-year warranty on paint and materials. We're committed to quality that lasts.",
  },
  {
    question: "How can I get a quote for my project?",
    answer:
      "Simply fill out our online form or contact us directly. We'll review your vehicle details and provide a free, no-obligation quote within 24 hours.",
  },
  {
    question: "Can I preview my design before starting?",
    answer:
      "Absolutely! Our live visualization tool lets you see real-time 2D previews from multiple angles. Save and share your designs easily.",
  },
];

export default function Home() {
  const { push } = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AutoStyles</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#collection"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Collection
            </Link>
            <Link
              href="#services"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Services
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          <Button
            onClick={() => push("/login")}
            size="lg"
            className="font-semibold "
          >
            Start Customizing
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary/30 to-background py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold leading-tight tracking-tight lg:text-7xl text-balance">
                    Choose Your Stylish{" "}
                    <span className="text-primary">Car</span> and Get Discount
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Transform your vehicle with our premium customization
                    services. Choose from a wide range of colors, finishes, and
                    styles to make your car truly unique.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  <Button size="lg" className="text-base font-semibold px-8">
                    Explore Collection
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base font-semibold px-8 bg-transparent"
                  >
                    View Pricing
                  </Button>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm text-muted-foreground">
                      Happy Customers
                    </div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div>
                    <div className="text-3xl font-bold">50+</div>
                    <div className="text-sm text-muted-foreground">
                      Color Options
                    </div>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div>
                    <div className="text-3xl font-bold">4.9</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto lg:mx-0">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 max-w-md lg:max-w-none">
                  <Image
                    src="https://images.unsplash.com/photo-1571171638497-a3e3c5e0c1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    alt="Luxury customized orange sports car"
                    className="h-full w-full object-contain"
                    width={500}
                    height={375}
                    priority
                  />
                  <div className="absolute top-4 right-4 bg-background/95 backdrop-blur px-4 py-2 rounded-full border border-border">
                    <span className="text-sm font-semibold">Latest Model</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full bg-background shadow-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex gap-2">
                    <div className="h-2 w-8 rounded-full bg-primary" />
                    <div className="h-2 w-2 rounded-full bg-muted" />
                    <div className="h-2 w-2 rounded-full bg-muted" />
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full bg-background shadow-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collection Section */}
        <section id="collection" className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-bold tracking-tight lg:text-5xl text-balance">
                Explore Your Dream Cars
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Browse our extensive collection of premium vehicles ready for
                customization. Each model can be tailored to your exact
                specifications.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {cars.map((car, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden border-2 hover:border-primary transition-all duration-300 max-w-sm"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
                      <Image
                        src={car.image}
                        alt={car.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        width={400}
                        height={300}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xl">{car.name}</h3>
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-secondary">
                            {car.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Premium customization package with multiple color
                          options and finishes available.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-bold text-primary">
                          {car.price}
                        </span>
                        <Button className="gap-2">
                          Choose More
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                View Full Collection
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="relative order-2 lg:order-1 mx-auto lg:mx-0">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl max-w-md lg:max-w-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                  <Image
                    src="https://images.unsplash.com/photo-1502877338535-766e3a6052c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    alt="Red classic customized car"
                    className="h-full w-full object-cover"
                    width={500}
                    height={667}
                  />
                  <div className="absolute top-8 left-8 bg-primary text-primary-foreground px-6 py-3 rounded-lg">
                    <div className="text-3xl font-bold">15+</div>
                    <div className="text-sm">Years Experience</div>
                  </div>
                </div>
              </div>

              <div className="space-y-8 order-1 lg:order-2 text-center lg:text-left">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight lg:text-5xl text-balance">
                    We Have Creative Services For You
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Transform your vehicle with our comprehensive customization
                    services. From color changes to complete makeovers, we bring
                    your vision to life.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 justify-items-center lg:justify-items-start">
                  {services.map((service, index) => (
                    <Card
                      key={index}
                      className="border-2 hover:border-primary transition-colors w-full max-w-sm"
                    >
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                            {service.number}
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-bold text-lg leading-tight">
                              {service.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-bold tracking-tight lg:text-5xl text-balance">
                Get In Touch
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Ready to start your customization journey? Contact us today for
                a free consultation.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Our Location</h3>
                    <p className="text-sm text-muted-foreground">
                      123 Auto Street, Car City, CC 12345
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Phone</h3>
                    <p className="text-sm text-muted-foreground">
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Email</h3>
                    <p className="text-sm text-muted-foreground">
                      hello@autostyles.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input placeholder="Your Name" />
                <Input placeholder="Your Email" type="email" />
                <Input placeholder="Subject" />
                <Input placeholder="Message" className="h-32" />
                <Button className="w-full">Send Message</Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="py-20 lg:py-32 bg-foreground text-background"
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight lg:text-5xl text-balance">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-background/70 leading-relaxed">
                  Get answers to common questions about our customization
                  process, pricing, and services. Can&#39;t find what you&#39;re
                  looking for? Contact our support team.
                </p>
              </div>

              <div className="space-y-6">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border-2 border-background/20 rounded-lg px-6 data-[state=open]:border-primary/50"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-6 text-base font-semibold">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-background/70 pb-6 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-8 rounded-2xl bg-background/5 border-2 border-background/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <HelpCircle className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        You have different questions?
                      </h3>
                      <p className="text-sm text-background/70">
                        Our support team is here to help
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Contact Support Team
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight lg:text-5xl text-balance">
                  Subscribe to Our Newsletter
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stay updated with the latest customization trends, exclusive
                  offers, and new color collections. Join our community of car
                  enthusiasts.
                </p>
              </div>

              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="h-12 text-base"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 font-semibold whitespace-nowrap"
                >
                  Subscribe
                </Button>
              </form>

              <p className="text-sm text-muted-foreground">
                By subscribing, you agree to our Privacy Policy and consent to
                receive updates from our company.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background w-full">
        <div className="container mx-auto py-12 lg:py-16 px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 justify-items-center lg:justify-items-start">
            <div className="space-y-4 text-center lg:text-left">
              <Link
                href="/"
                className="flex items-center gap-2 justify-center lg:justify-start"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Car className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AutoStyles</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transform your vehicle with premium customization services.
                Quality, creativity, and excellence in every detail.
              </p>
              <div className="flex gap-4 justify-center lg:justify-start">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="space-y-4 text-center lg:text-left">
              <h3 className="font-bold text-lg">Features</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Color Customization
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    2D Preview
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Real-time Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Save & Share
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4 text-center lg:text-left">
              <h3 className="font-bold text-lg">Help Center</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4 text-center lg:text-left">
              <h3 className="font-bold text-lg">Testimonials</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Customer Reviews
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Gallery
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} AutoStyles. All rights reserved.
              Designed with passion for automotive excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
