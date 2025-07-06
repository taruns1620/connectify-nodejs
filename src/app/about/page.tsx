
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Infinity, Zap, Users, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container py-12 md:py-20">
      <Card className="max-w-4xl mx-auto bg-card text-card-foreground shadow-xl rounded-xl">
        <CardHeader className="text-center pb-6">
          <Infinity className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse-glow" />
          <CardTitle className="text-4xl md:text-5xl font-bold font-orbitron tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
            About Connectify Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg dark:prose-invert mx-auto px-6 py-8 text-foreground/90 space-y-6">
          <p className="lead text-center text-xl !mb-10 text-muted-foreground">
            Welcome to CONNECTIFY HUB — your dynamic nexus for opportunity, growth, and impactful connections.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-center md:text-left">
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-background/30">
                <Zap className="h-10 w-10 text-accent mx-auto md:mx-0" />
                <h3 className="text-2xl font-semibold text-primary font-orbitron">Our Mission</h3>
                <p>
                To empower local vendors and service providers by connecting them with a vibrant community of clients, fostering growth, trust, and mutual success through an innovative and rewarding platform.
                </p>
            </div>
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-background/30">
                <Users className="h-10 w-10 text-accent mx-auto md:mx-0" />
                <h3 className="text-2xl font-semibold text-primary font-orbitron">Who We Are</h3>
                <p>
                We are a passionate team dedicated to bridging the gap between skilled professionals and individuals seeking their expertise. We believe in the power of local economies and the magic of direct, beneficial connections.
                </p>
            </div>
          </div>

          <div className="mt-8 space-y-3 p-4 rounded-lg border border-border/50 bg-background/30">
            <Target className="h-10 w-10 text-accent mx-auto md:mx-0" />
            <h3 className="text-2xl font-semibold text-primary font-orbitron text-center md:text-left">What We Offer</h3>
            <ul className="list-disc list-inside pl-0 md:pl-5 space-y-2">
              <li><strong>For Vendors:</strong> A platform to showcase your skills, expand your reach, manage client interactions efficiently, and benefit from a fair commission structure.</li>
              <li><strong>For Clients:</strong> Easy discovery of verified local vendors, a seamless way to engage services, and opportunities to earn cashback and rewards through referrals.</li>
              <li><strong>For Everyone:</strong> A simple, QR-powered system for check-ins and payments, real-time dashboards, and a community built on trust and shared growth.</li>
            </ul>
          </div>

          <blockquote className="border-l-4 border-primary pl-6 italic text-primary/90 !my-10 text-lg">
            At CONNECTIFY HUB, we believe that every connection has the potential to spark something great. We're committed to building a future where local businesses thrive and community collaboration flourishes.
          </blockquote>

          <p className="text-center font-semibold text-xl !mt-12">
            Dream it. Connect it. Achieve it — with <span className="text-primary font-orbitron">CONNECTIFY HUB</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
