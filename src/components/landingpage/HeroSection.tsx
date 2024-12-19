"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import Image from "next/image";
import { useEffect, useRef } from "react";

export const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement?.classList.add("scrolled");
      } else {
        imageElement?.classList.remove("scrolled");
      }
    };

    if (imageElement) {
      window.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="pb-20 px-4 overflow-y-hidden">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-8xl mb-4 lg:text-[100px] pb-6 gradient-title">
          Manage Your Finances
          <br />
          with Intelligence
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          An AI-powered platform to track, analyze, and optimize your finances
          with real-time insights for smarter decisions.
        </p>
        <div className="flex justify-center items-center space-x-4">
          <Link href={"/dashboard"}>
            <Button size={"lg"} className="px-8">
              Get Started
            </Button>
          </Link>
          <Link href={"#"}>
            <Button size={"lg"} variant={"outline"} className="px-8">
              Watch Demo
            </Button>
          </Link>
        </div>
        <div className="hero-image-wrapper">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.webp"
              width={1000}
              height={500}
              alt="An AI-powered financial management banner"
              className="rounded-lg shadow-2xl mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};
