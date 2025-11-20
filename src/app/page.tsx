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
        "https://scontent.fmnl13-4.fna.fbcdn.net/v/t39.30808-6/490824927_1091246506371204_6664277804586216558_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGTuWLJJkKr9I4QNoGHr66kzccotENfZIfNxyi0Q19kh1zsFJIuSPYxXnonfhGOdQiGxCOcESODV3neVBjgtW6C&_nc_ohc=YF0Slnx1t2EQ7kNvwGH663d&_nc_oc=AdlUCtIwAx5qknyKQF5C90wn-dyldKTbLlnP7s3EIP1zW-DkY3WjAzXQf4X_BjTsqYk&_nc_zt=23&_nc_ht=scontent.fmnl13-4.fna&_nc_gid=QPCo1LtzFfFJJtHmwlMrLg&oh=00_AfhY1npsiQbbzl1wr-PyKdCM8n93bwMTXcH-xWwq5C1bFg&oe=692267B7",
      alt: "AutoStyles customized car 1",
    },
    {
      image:
        "https://scontent.fmnl13-2.fna.fbcdn.net/v/t39.30808-6/487940910_1081000847395770_8161891473151918147_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeFcsAr9F5A42dQpCgn9xq1NaWyDPGYJa8xpbIM8ZglrzAdwb_cmcPi1l5Vu_DGJxOWjUNtQHIr-zTS0JFweWcXG&_nc_ohc=0QDJ_fO3GygQ7kNvwEIWFWK&_nc_oc=AdkA9E_XrS2GRO9ol6ld8sKgy067pM8rl9vYLmK9Jhq9O8lveMJKApCKliHm8L6oRHY&_nc_zt=23&_nc_ht=scontent.fmnl13-2.fna&_nc_gid=L4qnljJ4IncSkuOFQPYXZw&oh=00_AfirrVoB6pYZDpldflysQtdbDvl4ufBMbnirkelAXT8WIA&oe=692249A7",
      alt: "AutoStyles customized car 2",
    },
    {
      image:
        "https://scontent.fmnl13-2.fna.fbcdn.net/v/t39.30808-6/485911645_1070834321745756_1832389509894947724_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=111&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEXdNMnYfSAzXZx_08eJoCT7pg2W6LoWWbumDZbouhZZlYYgecZdfThvkvmWIfqj6bSnsoTbexKCsmDym-bmqe4&_nc_ohc=NKwDQXUMVqoQ7kNvwGQ-hmY&_nc_oc=Adkt8l6EPhdnG9fS9tFGWX_n9EXn8R0IPL-cx6louP128iTzZZXuIR2-WO0IvPTxbjM&_nc_zt=23&_nc_ht=scontent.fmnl13-2.fna&_nc_gid=M9vi6uKIWz5CfgoPAfb8kg&oh=00_AfiPoOVO77kq1Fiyulj13EjXq0hpyI1VLkEeA4KYVWdGmg&oe=69226BAB",
      alt: "AutoStyles customized car 3",
    },
    {
      image:
        "https://scontent.fmnl13-4.fna.fbcdn.net/v/t39.30808-6/481701454_1059612626201259_1222920101485924553_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeH4tntA8i8_tl--VTE_jVA5vGVogGi9ML28ZWiAaL0wvfcrVl0J0v6s6QfZz1_Qd2A28XNuSGJDeVGGrkzlR2RC&_nc_ohc=Rv2mTn7ZPskQ7kNvwHFpEZL&_nc_oc=AdlrqdjLt_il84pM4qxS80ZaFjw4CdsSnNbZi-VZLET3x3pO5NEqKmkJH6z0dl3QaBk&_nc_zt=23&_nc_ht=scontent.fmnl13-4.fna&_nc_gid=dyXjQKsVc67vnFKy-xg48g&oh=00_Afgq7DtD4fuxjhBO0uybhorRgMmHYs12QayIftHY2rsUWg&oe=692249D6",
      alt: "AutoStyles customized car 4",
    },
    {
      image:
        "https://scontent.fmnl13-3.fna.fbcdn.net/v/t39.30808-6/481081596_1052923300203525_303428817841296234_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeH26HUnpUue8sZYSREbi77l6jPYlFso35PqM9iUWyjfk9ByiKPFCV8Slfz0qr6PgZ3Tfr1syQIPmt_UhD-gLQVh&_nc_ohc=c-YyzdvOcWoQ7kNvwFAoMXs&_nc_oc=AdnrvBuhiOiUSRnOuQ2WzG8FiVzr1PL-CWGfOJrpufENnMBWnoUP2R6rHwmiRid_-YE&_nc_zt=23&_nc_ht=scontent.fmnl13-3.fna&_nc_gid=qCy6hnMOVjmylcXg0yI4Lg&oh=00_AfglnDhBymbNPFaxRM-N-_k1A2VtKlVdEu71205Xkn5C9Q&oe=69226059",
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
                    <Link href={"/login"}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto lg:mx-0">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 max-w-md lg:max-w-none">
                  {heroSlides.map((slide, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? "opacity-100" : "opacity-0"
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
                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
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
      </main>

      {/* Footer */}
      <footer className="border-t bg-background w-full">
        <div className="container mx-auto py-12 lg:py-16 px-4">
          <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-1 justify-items-center lg:justify-items-center">
            <div className="space-y-4 text-center lg:text-left">
              <Link
                href="/"
                className="flex items-center gap-2 justify-center lg:justify-center"
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
              <div className="flex gap-4 justify-center lg:justify-center">
                <Link
                  href="https://www.facebook.com/AutowerkesPH/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link
                  href="https://www.instagram.com/autowerkes1/reels/?hl=en"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              </div>
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
