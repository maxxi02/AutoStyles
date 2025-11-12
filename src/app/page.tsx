"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Facebook,
  HelpCircle,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Shield,
  Twitter,
  Users,
  Youtube,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      image:
        "https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/464151342_27551660981115826_2519574407233915309_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=86c6b0&_nc_eui2=AeGVnZUr13y-hofMTvo0jNCnnIQZhn9V5lychBmGf1XmXPCrvrL4p-FLcOumzYnPPRDKmmuiBZiAqsfVAq0WdYKf&_nc_ohc=F63sAcwFxqIQ7kNvwG7RdOQ&_nc_oc=AdmaSI3dg38EqsCB6LFNB5VpuI-vgkzFTCHtQHUVY41Egb5rxL629tuY8LoR9GrPo8s&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=4jumwGb5gMnFg0zAoqGLEQ&oh=00_AfjZSWCwu3CqlvCD-MU9MpX6NLaRqxmkmpI2oocjj_wpdw&oe=691A031D",
      alt: "AutoStyles customized car 1",
    },
    {
      image:
        "https://scontent.fmnl30-1.fna.fbcdn.net/v/t39.30808-6/482000458_28975415192073724_2252981353448231833_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeFXzAxmC7btyEqL0CO6xgiNHuGhflA1Czce4aF-UDULN3srE33NsEtta-ICLg7yvTCKHo-9OUsto-CTwa11eA1z&_nc_ohc=OP_ldnrZ2PYQ7kNvwHvYNp1&_nc_oc=AdnMvDNohhwZZDIPSyjDmcN2l6KZaxLHsaxqZ-yE4R_wvbAOZOqGTGKS__-yqm1qcyw&_nc_zt=23&_nc_ht=scontent.fmnl30-1.fna&_nc_gid=xx1R8W_7__DC0lEwWWZZwA&oh=00_AfgDe2IYFHCP55Lwg50AyViqYmIrFKd54Ru1ljQOzVZNkg&oe=6919DFA0",
      alt: "AutoStyles customized car 2",
    },
    {
      image:
        "https://scontent.fmnl30-1.fna.fbcdn.net/v/t39.30808-6/465438652_27687328930882363_724556434674650557_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGMYFG-xLyJGXAPdcBxLfr8JdMlSLAtSgUl0yVIsC1KBaPOoEVhuU2scqsjh2Mxly8h0b5awsS8SkyAjqUMmViY&_nc_ohc=4z-FVwvSASIQ7kNvwHn3YPn&_nc_oc=AdkV4yyiS-RZ6mSFYcaC9kIbnqG6OmPMT8SZ5eb8OKHxcmRDmu1u-eCM7xMD5_jDGxE&_nc_zt=23&_nc_ht=scontent.fmnl30-1.fna&_nc_gid=UIRXU26hUGhAtRSETQI1cQ&oh=00_Afiijz2MJC7XjYgt0MI_yJa9oSJjL5xCeU5BPzbRKDgHHA&oe=6919FFF2",
      alt: "AutoStyles customized car 3",
    },
    {
      image:
        "https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/465023409_27655031144112142_3665967185021494388_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=86c6b0&_nc_eui2=AeEwbavyAMLECCXPo6ot_uxSmNrdVDSG0FCY2t1UNIbQUHycStCouvOs1_PbPReqOugfDGxDyUfpBpDhe--G0QCS&_nc_ohc=77LsiMZR4BoQ7kNvwHdzA-n&_nc_oc=AdkyEO4m3w0FbB0dLsMkR2BkeQTu1Ie8uJAhKAnviBPT2nLngNisgFllhwHd9HkcBno&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=3xkZ_XR29Qubg8YFqrLBTw&oh=00_Afhwrb8E2hny11b2EIejM7QS6GgwwMa8R6jiX2ytXhfvpA&oe=691A06AB",
      alt: "AutoStyles customized car 4",
    },
    {
      image:
        "https://scontent.fmnl30-1.fna.fbcdn.net/v/t39.30808-6/464155834_27563311703284087_7897004082253006181_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=86c6b0&_nc_eui2=AeH9o21uxEUh_VzzsIqPFiVbusXXNZNe0ja6xdc1k17SNnV5j3vjfHxMemK-5BmcrjfVNgzTVzTdLhIgys0JOYHU&_nc_ohc=QbpZHTKjzg8Q7kNvwEdE0OS&_nc_oc=AdlDa7fuO_LU8I3b9iRiVsTpCly0VVJx4lPS_wNxSk5iYIVpIMrmL1A5WYzcKH0v2Mc&_nc_zt=23&_nc_ht=scontent.fmnl30-1.fna&_nc_gid=owBUA5BFcjUpXRR2WCEGvA&oh=00_Afh_ypU2WzkIKepeXur4aQQbYQn-DqbV8DFLzDi1MmkPmw&oe=6919E022",
      alt: "AutoStyles customized car 5",
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
    );
  }, [heroSlides.length]);

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [nextSlide]);

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
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base font-semibold px-8 bg-transparent"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto lg:mx-0">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 max-w-md lg:max-w-none">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        index === currentSlide ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Image
                        src={slide.image}
                        alt={slide.alt}
                        className="h-full w-full object-contain transform transition-transform duration-700 hover:scale-105"
                        width={500}
                        height={375}
                        priority={index === 0}
                      />
                    </div>
                  ))}
                  <div className="absolute top-4 right-4 bg-background/95 backdrop-blur px-4 py-2 rounded-full border border-border animate-fade-in">
                    <span className="text-sm font-semibold">Latest Model</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 animate-fade-up">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full bg-background shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex gap-2">
                    {heroSlides.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentSlide
                            ? "w-8 bg-primary"
                            : "w-2 bg-muted hover:w-8"
                        }`}
                        onClick={() => setCurrentSlide(index)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Go to slide ${index + 1}`}
                        title={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full bg-background shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 lg:py-32 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-12">
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

                <div className="grid gap-6 sm:grid-cols-2 justify-items-center">
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
                CONTACT US
              </h2>
              {/* <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Ready to start your customization journey? Contact us today for
        a free consultation.
      </p> */}
            </div>
            <div className="max-w-md mx-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Our Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Callejon St., Brgy. Sambat, Tanauan, Philippines
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
                      0917 725 0985
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
                      autowerkesph@gmail.com
                    </p>
                  </div>
                </div>
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
