import { RegisterForm } from "@/forms/register-form";
import Image from "next/image";

const RegisterPage = () => {
  return (
    <div className="flex min-h-svh w-full items-stretch">
      {/* Left Side: Design */}
      <div className="relative hidden w-full overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/20 to-background md:block md:w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1540951236303-258adc2f4e74?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Luxury Corvette customization"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Unlock Your Style</h2>
          <p className="text-lg max-w-sm leading-relaxed">
            Discover endless possibilities for your Corvette with our premium
            customization services.
          </p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex w-full items-center justify-center bg-background px-6 py-8 md:w-1/2 md:px-10 md:py-12">
        <div className="w-full max-w-sm">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Create Your Account
              </h1>
              <p className="text-sm text-muted-foreground">
                Join us to start customizing your dream Corvette
              </p>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
