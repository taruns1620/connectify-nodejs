
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, Building2, Camera, Handshake, Home, Landmark, Paintbrush } from 'lucide-react';

type Sparkle = {
    id: number;
    top: string;
    left: string;
    delay: string;
};

// Hero Section Client Component for animations
const HeroSectionClient: React.FC = () => {
  const [showTagline, setShowTagline] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const taglineTimer = setTimeout(() => setShowTagline(true), 500); // Shortened delay for tagline

    // Generate sparkles only on the client after mount
    if (typeof window !== 'undefined') {
      setSparkles(
          Array.from({ length: 15 }).map((_, i) => ({
              id: i,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              delay: `${Math.random() * 1}s`,
          }))
      );
    }


    return () => clearTimeout(taglineTimer);
  }, []);


  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70svh] md:min-h-[80svh] text-center overflow-hidden bg-gradient-to-br from-black via-black to-orange-900/70 text-white px-4 py-16">
        {/* Animated floating icons - Keep static part here, animation handled by CSS */}
        <div className="absolute inset-0 z-0 opacity-15 md:opacity-25">
            <Paintbrush className="absolute top-[10%] left-[15%] h-9 w-9 md:h-11 md:w-11 text-orange-400 animate-float" style={{ animationDelay: '0s' }} />
            <Landmark className="absolute top-[20%] right-[10%] h-11 w-11 md:h-13 md:w-13 text-orange-500 animate-float" style={{ animationDelay: '1s' }}/>
            <Camera className="absolute bottom-[15%] left-[25%] h-7 w-7 md:h-9 md:w-9 text-orange-300 animate-float" style={{ animationDelay: '2s' }}/>
            <Handshake className="absolute bottom-[10%] right-[20%] h-13 w-13 md:h-15 md:w-15 text-orange-600 animate-float" style={{ animationDelay: '0.5s' }}/>
            <Building2 className="absolute top-[50%] left-[5%] h-9 w-9 md:h-11 md:w-11 text-orange-400 animate-float" style={{ animationDelay: '1.5s' }}/>
             <Home className="absolute top-[40%] right-[30%] h-9 w-9 md:h-11 md:w-11 text-orange-500 animate-float" style={{ animationDelay: '2.5s' }}/>
        </div>

       {/* Sparkle effect - Render only after mount on the client */}
       {isMounted && sparkles.map(s => (
           <div key={s.id} className="sparkle" style={{ top: s.top, left: s.left, animationDelay: s.delay }}></div>
       ))}


      {/* Content */}
      <div className="z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 animate-fade-in tracking-tight font-orbitron">
           {/* Adjusted tracking for CONNECTIFY */}
           <span className="bg-gradient-to-r from-orange-400 to-orange-600 text-transparent bg-clip-text tracking-normal">
             CONNECTIFY
           </span>
           <span className="block text-white mt-1 md:mt-2">
             HUB
           </span>
        </h1>
         {/* Tagline animation controlled by state */}
         <p className={`text-base sm:text-lg md:text-2xl font-medium text-orange-300/90 max-w-lg mx-auto transition-opacity duration-1000 ${showTagline ? 'opacity-100 animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }} >
           YOUR NEED, OUR NETWORK.
         </p>
         {/* Buttons appear after tagline */}
         <div className={`mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center items-center gap-4 transition-opacity duration-1000 ${showTagline ? 'opacity-100 animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
           <Button
             asChild
             size="lg"
             className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl px-6 sm:px-8 py-3 text-base sm:text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-orange-500/40 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black"
           >
             <Link href="/providers">FIND A SERVICE</Link>
           </Button>
           <Button
             asChild
             size="lg"
             variant="outline"
             className="w-full sm:w-auto border-orange-500 border-2 text-white font-semibold rounded-xl px-6 sm:px-8 py-3 text-base sm:text-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-orange-500/40 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-500 hover:border-transparent"
           >
             <Link href="/signup">JOIN AS A VENDOR</Link>
           </Button>
         </div>
      </div>
       {/* Subtle gradient overlay at the bottom */}
       <div className="absolute bottom-0 left-0 right-0 h-16 md:h-20 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  );
};

export default HeroSectionClient;

