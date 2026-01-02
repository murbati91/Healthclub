"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useTranslation } from "@/lib/translations";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export function Footer() {
  const { language } = useLanguage();
  const t = useTranslation(language);
  return (
    <footer className="bg-green-50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.jpg"
                alt="Healthy Club"
                width={60}
                height={60}
                className="rounded-full"
              />
              <div>
                <h3 className="text-xl font-bold">
                  <span className="text-green-700">{language === "ar" ? "نادي" : "Healthy"}</span>{" "}
                  <span className="text-blue-500">{language === "ar" ? "الصحة" : "Club"}</span>
                </h3>
                <p className="text-xs text-muted-foreground">{t("Restaurant")}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("Eat Healthy to be Strong. Fresh, nutritious meals delivered to your door.")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t("Quick Links")}</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-green-700 transition-colors">
                {t("Home")}
              </Link>
              <Link href="#features" className="text-sm text-muted-foreground hover:text-green-700 transition-colors">
                {t("Menu")}
              </Link>
              <Link href="#packages" className="text-sm text-muted-foreground hover:text-green-700 transition-colors">
                {t("Packages")}
              </Link>
              <Link href="/subscribe" className="text-sm text-muted-foreground hover:text-green-700 transition-colors">
                {t("Subscribe")}
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t("Contact Us")}</h4>
            <div className="flex flex-col space-y-3">
              <a href="tel:+97333775587" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-700 transition-colors">
                <Phone className="h-4 w-4 text-green-700" />
                <span>+973 33 77 55 87</span>
              </a>
              <a href="https://wa.me/97333775587" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-600 transition-colors">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span>{t("WhatsApp Us")}</span>
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-green-700" />
                <span>{t("Bahrain")}</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t("Follow Us")}</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/healthy_club_bh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-6 w-6" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">@healthy_club_bh</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {language === "ar" ? "نادي الصحة" : "Healthy Club"} {t("Restaurant")}. {t("All rights reserved")}.</p>
        </div>
      </div>
    </footer>
  );
}
