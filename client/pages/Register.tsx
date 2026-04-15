import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 pt-12 pb-12">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70"></div>

      <div className="w-full max-w-md relative z-10 pt-10">
        <Card className="border-white/20 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-300">
          <div className="p-8">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg text-white">
                <span className="font-heading font-bold text-2xl">M</span>
              </div>
              <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
                MindCare
              </h1>
              <p className="text-sm text-muted-foreground">
                Start your mental wellness journey today
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-border/50 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-border/50 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border/50 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-border/50 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-6"
                />
              </div>

              <Button className="w-full rounded-xl py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold transition-all shadow-md hover:shadow-lg mt-6">
                Create Account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-transparent text-muted-foreground bg-white dark:bg-slate-900 rounded-full">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <Link to="/login">
              <Button variant="outline" className="w-full rounded-xl py-6 border border-border/50 bg-background/50 hover:bg-background/80 shadow-sm transition-all drop-shadow-sm text-foreground">
                Sign In
              </Button>
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 px-4">
          Your mental health is our priority. All conversations are encrypted and confidential.
        </p>
      </div>
    </div>
  );
}
