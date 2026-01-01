"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Phone, MapPin, Clock, ChevronLeft, ChevronRight, Salad, Leaf, Cookie, Fish, UtensilsCrossed } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// Hero carousel images
const heroSlides = [
  { image: "/images/menu/menu-image1.jpg", title: "American Breakfast" },
  { image: "/images/menu/menu-image2.jpg", title: "Fresh Salads" },
  { image: "/images/menu/menu-image3.jpg", title: "Healthy Lunch" },
  { image: "/images/menu/menu-image4.jpg", title: "Special Dishes" },
  { image: "/images/menu/menu-image5.jpg", title: "Nutritious Snacks" },
  { image: "/images/menu/menu-image6.jpg", title: "Fresh Bowls" },
];

// Menu items for the gallery
const menuItems = [
  { image: "/images/menu/menu-image1.jpg", title: "Breakfast", types: "Normal / Vegetarian / Keto / Special", days: "20 Days / 24 Days / 26 Days" },
  { image: "/images/menu/menu-image2.jpg", title: "Lunch", types: "Normal / Vegetarian / Keto / Special", days: "20 Days / 24 Days / 26 Days" },
  { image: "/images/menu/menu-image3.jpg", title: "Dinner", types: "Normal / Vegetarian / Keto / Special", days: "20 Days / 24 Days / 26 Days" },
  { image: "/images/menu/menu-image4.jpg", title: "Special", types: "Normal / Vegetarian / Keto / Special", days: "20 Days / 24 Days / 26 Days" },
  { image: "/images/menu/menu-image5.jpg", title: "Snacks", types: "Normal / Vegetarian / Keto / Special", days: "20 Days / 24 Days / 26 Days" },
  { image: "/images/menu/menu-image6.jpg", title: "Salad", types: "Normal / Vegetarian / Keto / Special", days: "20 Days / 24 Days / 26 Days" },
];

// Healthy packages with images
const packages = [
  {
    name: "Normal",
    image: "/images/packages/normal.jpg",
    description: "Balanced nutrition for everyday health",
    features: [
      "1 / 2 / 3 meal",
      "20 / 24 / 26 Days Per Month",
      "5 / 6 / 7 Days Per Week",
      "Choose days",
      "Choose what you are not eat",
      "Free delivery",
    ],
  },
  {
    name: "Keto",
    image: "/images/packages/keto.jpg",
    description: "Low-carb, high-fat ketogenic meals",
    features: [
      "1 / 2 / 3 meal",
      "20 / 24 / 26 Days Per Month",
      "5 / 6 / 7 Days Per Week",
      "Choose days",
      "Choose what you are not eat",
      "Free delivery",
    ],
  },
  {
    name: "Vegetarian",
    image: "/images/packages/veg.jpg",
    description: "Plant-based nutrition",
    features: [
      "1 / 2 / 3 meal",
      "20 / 24 / 26 Days Per Month",
      "5 / 6 / 7 Days Per Week",
      "Choose days",
      "Choose what you are not eat",
      "Free delivery",
    ],
  },
  {
    name: "Special",
    image: "/images/packages/speical.jpg",
    description: "Customized for your dietary needs",
    features: [
      "1 / 2 / 3 meal",
      "20 / 24 / 26 Days Per Month",
      "5 / 6 / 7 Days Per Week",
      "Choose days",
      "Choose what you are not eat",
      "Free delivery",
    ],
  },
];

// Meal categories
const mealCategories = [
  { image: "/images/meals/meal-image1.jpg", title: "Vegetarian", description: "Various options of vegetarian main dishes and vegetables cooked in healthy ways." },
  { image: "/images/meals/meal-image2.jpg", title: "Special Dishes", description: "They accommodate special dietary needs, such as gluten-free or lactose-free options." },
  { image: "/images/meals/meal-image3.jpg", title: "Keto", description: "The ketogenic diet (keto) is a low-carb, high-fat diet that causes weight loss and provides numerous health benefits." },
  { image: "/images/meals/meal-image4.jpg", title: "Normal", description: "A healthy diet consists of many fresh fruits and vegetables and limits processed foods." },
];

// Diet information for carousel
const diets = [
  { title: "Vegetarian diet", description: "A vegetarian diet focuses on plant-based proteins like beans, lentils, nuts and soy and also includes dairy and eggs.", cta: "Start vegetables diet now" },
  { title: "Normal diet", description: "A healthy eating plan gives your body the nutrients it needs every day while staying within your daily calorie goal for weight loss.", cta: "Try Normal diet now" },
  { title: "Keto diet", description: "The keto diet, a high-fat, very low-carb diet that helps you burn fat more effectively.", cta: "Lose extra weight with keto diet now" },
];

export default function Home() {
  const router = useRouter();

  // Hero carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const features = [
    { icon: Salad, title: "Fresh salads and sauces", color: "text-green-600" },
    { icon: Leaf, title: "Vegetarian Dishes", color: "text-green-500" },
    { icon: Cookie, title: "Snacks", color: "text-amber-500" },
    { icon: Fish, title: "Seafood dishes", color: "text-blue-500" },
    { icon: UtensilsCrossed, title: "Special Dietary Options", color: "text-orange-500" },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Carousel Section */}
      <section className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {heroSlides.map((slide, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 relative">
                <div className="relative h-[500px] md:h-[600px]">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <div className="mb-6">
                        <Image
                          src="/images/logo.jpg"
                          alt="Healthy Club"
                          width={120}
                          height={120}
                          className="rounded-full mx-auto shadow-2xl border-4 border-white"
                        />
                      </div>
                      <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        <span className="text-green-400">Healthy</span>{" "}
                        <span className="text-blue-300">Club</span>
                      </h1>
                      <p className="text-xl md:text-2xl mb-6 font-medium">Eat Healthy to be Strong</p>
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-6"
                        onClick={() => router.push("/register")}
                      >
                        Start Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        >
          <ChevronRight className="h-6 w-6 text-gray-800" />
        </button>

        {/* Carousel Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? "bg-green-500 w-8" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              We offer a variety of diets that focus on natural
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex flex-col items-center gap-3 p-4">
                  <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">{feature.title}</span>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              onClick={() => router.push("/register")}
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      </section>

      {/* Healthy Packages Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Healthy Packages</h2>
            <p className="text-gray-500">We have nice Meals</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {mealCategories.map((meal, index) => (
              <Card
                key={index}
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => router.push("/register")}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={meal.image}
                    alt={meal.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {meal.title}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{meal.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{meal.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Subscriptions - Menu Gallery */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Our Subscriptions</h2>
            <p className="text-gray-500">Offers & Deals</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg cursor-pointer aspect-square"
                onClick={() => router.push("/register")}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-xs text-gray-200">{item.types}</p>
                  <p className="text-xs text-gray-300">{item.days}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages with Pricing */}
      <section id="packages" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Our Packages</h2>
            <p className="text-gray-500">Choose the perfect plan for your lifestyle</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={pkg.image}
                    alt={pkg.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{pkg.name}</h3>
                  <p className="text-green-600 font-medium text-sm mb-4">Offer</p>
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => router.push("/register")}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button
              size="lg"
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-8"
              onClick={() => router.push("/register")}
            >
              Find more options
            </Button>
          </div>
        </div>
      </section>

      {/* Our Diets Section */}
      <section className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Our Diets</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {diets.map((diet, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-white">
                <h3 className="text-xl font-bold text-green-700 mb-3">{diet.title}</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{diet.description}</p>
                <p className="text-green-600 font-medium text-sm">{diet.cta}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Image Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/about-image.jpg"
                alt="Healthy Food"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Why Choose <span className="text-green-600">Healthy</span> <span className="text-blue-500">Club</span>?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Eating healthy is the foundation of a strong body and mind. Our meals are
                crafted with fresh, natural ingredients to support your wellness journey.
                Whether you're looking to lose weight, build muscle, or simply maintain a
                balanced lifestyle, we have the perfect meal plan for you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Fresh ingredients daily</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Free delivery to your door</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Customizable meal plans</span>
                </div>
              </div>
              <Button
                size="lg"
                className="mt-8 bg-green-600 hover:bg-green-700 text-white px-8"
                onClick={() => router.push("/register")}
              >
                Start Your Journey Today
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Address */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-green-400">Address</h3>
              <div className="flex items-start gap-2 text-gray-300">
                <MapPin className="h-5 w-5 mt-0.5 text-green-400" />
                <span>Bahrain</span>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-green-400">Contact</h3>
              <div className="space-y-2">
                <a href="tel:+97333775587" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <Phone className="h-5 w-5 text-green-400" />
                  <span>33 77 55 87</span>
                </a>
              </div>
            </div>

            {/* Open Hours */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-green-400">Open Hours</h3>
              <div className="flex items-start gap-2 text-gray-300">
                <Clock className="h-5 w-5 mt-0.5 text-green-400" />
                <div>
                  <p className="text-red-400">Friday: Closed</p>
                  <p className="font-medium">From Saturday to Thursday</p>
                  <p>7:00 AM - 9:00 PM</p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-green-400">Follow Us</h3>
              <a
                href="https://instagram.com/healthy_club_bh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-pink-400 transition-colors"
              >
                <InstagramIcon className="h-6 w-6" />
                <span>@healthy_club_bh</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
