
'use client';

import React from 'react';
import { PlayCircle } from 'lucide-react'; // Keep icon import if needed elsewhere, otherwise remove

// Placeholder for the About Section - Client Component
const AboutSectionClient: React.FC = () => {
  return (
    <div className="container py-16 md:py-24 text-center bg-background"> {/* Changed text-left to text-center */}

      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">About <span className="text-primary">CONNECTIFY HUB</span></h2>
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-lg text-muted-foreground space-y-4"> {/* Added prose styling */}
        <p>
          CONNECTIFY HUB is a smart platform that helps people find the right service providers—like interior designers, property dealers, web developers, and more. If someone needs help with a project, they can come to CONNECTIFY HUB to find trusted experts nearby.
        </p>
        <p>
          But here’s the exciting part: when you suggest a service provider to someone and they visit using your referral, you earn cashback or rewards! Each service provider has a special QR code. When your friend scans it and takes the service, the system knows you sent them—and you get rewarded.
        </p>
        <p>
          It’s simple:
        </p>
        <ul className="list-disc list-inside pl-5 text-left"> {/* Ensure list remains left-aligned within the centered block */}
          <li>Find a trusted expert on CONNECTIFY HUB.</li>
          <li>Refer them to your friends or family.</li>
          <li>When they visit and take the service, you earn money or cashback!</li>
        </ul>
        <p>
          We make it easy for both clients and service providers to connect, work, and grow—while you earn by simply referring and helping others.
        </p>
      </div>
    </div>
  );
};

export default AboutSectionClient;
