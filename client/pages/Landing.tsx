import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Shield, Activity, Sparkles, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

// Simple Typewriter component
const Typewriter = ({ text, delay = 50 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{currentText}<span className="animate-pulse border-r-2 border-primary ml-1 h-full"></span></span>;
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navbar for Unauthenticated Users */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-md">
              <span className="font-heading font-bold text-sm">M</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">MindCare</span>
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#technology" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Technology</a>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-medium hover:bg-muted/50 rounded-lg">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background abstract blobs */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 -translate-x-1/2"></div>
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-4">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>AI-Powered Mental Health Analysis</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight text-foreground leading-[1.1]">
              Your Safe Space to <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative inline-block min-h-[1.2em]">
                <Typewriter text="Understand Your Emotions." delay={80} />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              MindCare is an advanced, non-judgmental platform that listens to you. 
              By analyzing your story, it helps detect early signs of stress, anxiety, and depression using cutting-edge Explainable AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/register">
                <Button className="w-full sm:w-auto h-14 px-8 text-base bg-foreground text-background hover:bg-foreground/90 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-border/60 hover:bg-muted/50 rounded-xl transition-all">
                  Learn How it Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-24 bg-card/30 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">What We Can Detect</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our advanced Natural Language Processing system is trained to identify linguistic patterns corresponding to three major emotional states.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Depression", desc: "Identifies phrases indicating prolonged sadness, loss of interest, and severe fatigue.", color: "#0369C2", icon: Brain },
              { title: "Anxiety", desc: "Recognizes patterns of excessive worry, restlessness, and panic-related keywords.", color: "#8680C6", icon: Activity },
              { title: "Stress", desc: "Detects signs of emotional overwhelm, pressure, and frustration in your narrative.", color: "#F2393D", icon: Shield },
            ].map((feature, idx) => (
              <div key={idx} className="bg-background rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div 
                  className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: feature.color }} 
                />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology / XAI LIME Info */}
      <section id="technology" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-green-mint/5 to-background z-0"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-8">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Transparent Analysis with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">XAI LIME</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe AI shouldn't be a "black box" when it comes to your mental health. 
              Our system uses <strong>LIME (Local Interpretable Model-agnostic Explanations)</strong> to show you exactly <em>why</em> an emotion was detected.
            </p>
            <ul className="space-y-4">
              {[
                "Highlights specific words in your text that trigger emotion detection",
                "Provides clear percentage probabilities for Stress, Anxiety, and Depression",
                "Helps professional counselors understand the root of distress immediately",
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="mt-1 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:w-1/2 w-full">
            {/* Visual Representation of XAI */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-sm text-foreground">Example XAI Feedback</span>
              </div>
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm leading-relaxed">
                  "Saya <span className="bg-[#0369C2] text-white px-1.5 py-0.5 rounded">sangat sedih</span> dan merasa <span className="bg-[#8680C6] text-white px-1.5 py-0.5 rounded">pusing</span> memikirkan hari esok..."
                </div>
                
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Probabilities</p>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Depression</span>
                      <span className="text-muted-foreground">75%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0369C2] h-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">Anxiety</span>
                      <span className="text-muted-foreground">42%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-[#8680C6] h-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-20 bg-foreground text-background text-center px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-heading font-bold">Ready to take the first step?</h2>
          <p className="text-background/70 text-lg">
            Create a free account to log your sessions, track your emotional trends, and gain peace of mind.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link to="/register">
              <Button className="h-14 px-10 text-base bg-white text-foreground hover:bg-white/90 rounded-xl shadow-lg hover:shadow-xl transition-all">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-background/10 text-background/50 text-sm">
          © 2024 MindCare. All rights reserved. This tool does not replace professional medical diagnosis.
        </div>
      </footer>
    </div>
  );
}
