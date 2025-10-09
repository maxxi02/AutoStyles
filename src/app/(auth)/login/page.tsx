import { LoginForm } from "@/forms/login-form";
import Image from "next/image";

const LoginPage = () => {
  return (
    <div className="flex min-h-svh w-full items-stretch">
      {/* Left Side: Form */}
      <div className="flex w-full items-center justify-center bg-background px-6 py-8 md:w-1/2 md:px-10 md:py-12">
        <div className="w-full max-w-sm">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to start customizing
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right Side: Design */}
      <div className="relative hidden w-full overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/20 to-background md:block md:w-1/2">
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
          alt="Luxury car customization"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-8 left-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Unlock Your Style</h2>
          <p className="text-lg max-w-sm leading-relaxed">
            Discover endless possibilities for your vehicle with our premium
            customization services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
