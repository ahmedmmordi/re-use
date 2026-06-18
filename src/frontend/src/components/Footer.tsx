import { Facebook, Twitter, Instagram, Youtube, MapPin } from "lucide-react";

export function Footer() {
  const shopLinks = [
    { label: "Trending", href: "#" },
    { label: "Categories", href: "/categories" },
    { label: "Deals", href: "#" },
    { label: "How it works", href: "#" },
    { label: "Create an account", href: "/signup" },
  ];

  const sellLinks = ["How to sell", "Packaging", "Shipping", "Getting paid", "Authenticate"];

  const supportLinks = [
    "Contact Us",
    "Marketplace Guidelines",
    "Safety Guidelines",
    "Buyer Protection",
    "Seller Protection",
    "Refunds and Returns",
  ];

  return (
    <footer className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white">
      {/* Main Footer Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 md:py-16">
        {/* Top Section - Main Columns */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 md:gap-12 mb-2 sm:mb-4 md:mb-2">
          {/* SHOP Column */}
          <div>
            <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold mb-4 sm:mb-5 md:mb-6 tracking-wide">
              SHOP
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 md:space-y-3">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`text-[13px] sm:text-[14px] md:text-[15px] text-gray-300 hover:text-white hover:underline transition-colors duration-200 ${
                      link.label === "Create an account" ? "font-semibold text-white" : ""
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SELL Column */}
          <div>
            <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold mb-4 sm:mb-5 md:mb-6 tracking-wide">
              SELL
            </h3>
            <ul className="space-y-3">
              {sellLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className={`text-[13px] sm:text-[14px] md:text-[15px] text-gray-300 hover:text-white hover:underline transition-colors duration-200 ${
                      link === "How to sell" ? "font-semibold text-white" : ""
                    }`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT Column */}
          <div>
            <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold mb-4 sm:mb-5 md:mb-6 tracking-wide">
              SUPPORT
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className={`text-[13px] sm:text-[14px] md:text-[15px] text-gray-300 hover:text-white hover:underline transition-colors duration-200 ${
                      link === "Contact Us" ? "font-semibold text-white" : ""
                    }`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY & POLICIES Column */}
          <div>
            <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold mb-4 sm:mb-5 md:mb-6 tracking-wide">
              COMPANY & POLICIES
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/about"
                  className="text-[13px] sm:text-[14px] md:text-[15px] text-gray-300 hover:text-white hover:underline transition-colors duration-200"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/legal"
                  className="text-[13px] sm:text-[14px] md:text-[15px] text-gray-300 hover:text-white hover:underline transition-colors duration-200"
                >
                  Policy Center
                </a>
              </li>
            </ul>
          </div>

          {/* Payment & Social Column */}
          <div className="col-span-2 lg:col-span-1">
            {/* We Accept */}
            <div className="mb-8">
              <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold mb-4 sm:mb-5 md:mb-6 tracking-wide">
                WE ACCEPT
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {/* Visa */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-6" viewBox="0 0 48 16" fill="none">
                    <rect x="0" y="0" width="48" height="16" fill="white" />
                    <path
                      d="M19.5 3.5L17.8 12.5H15.8L17.5 3.5H19.5ZM28 8.3L29.2 5L29.9 8.3H28ZM30.5 12.5H32.4L30.7 3.5H29C28.6 3.5 28.3 3.7 28.1 4L25 12.5H27.2L27.6 11.3H30.2L30.5 12.5ZM25.3 6.8C25.3 9 22.9 9.1 22.9 10C22.9 10.3 23.2 10.6 23.9 10.7C24.3 10.7 25.2 10.7 26.2 10.2L26.5 11.7C25.9 12 25.2 12.2 24.3 12.2C22.3 12.2 20.9 11.1 20.9 9.5C20.9 8.3 22 7.4 22.9 6.9C23.8 6.4 24.1 6.1 24.1 5.6C24.1 5 23.4 4.7 22.7 4.7C21.7 4.7 21.2 4.9 20.4 5.3L20.1 3.8C20.9 3.5 21.9 3.2 22.9 3.2C25 3.2 26.3 4.3 26.3 6.1L25.3 6.8ZM15 3.5L12.2 12.5H10L8.2 5.3C8.1 4.9 8 4.7 7.7 4.5C7.1 4.2 6.2 3.9 5.4 3.7L5.5 3.5H9.2C9.7 3.5 10.1 3.9 10.2 4.4L11.1 9.3L13.2 3.5H15Z"
                      fill="#1434CB"
                    />
                  </svg>
                </div>

                {/* Mastercard */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-6" viewBox="0 0 48 32" fill="none">
                    <circle cx="19" cy="16" r="10" fill="#EB001B" />
                    <circle cx="29" cy="16" r="10" fill="#F79E1B" />
                    <path
                      d="M24 9.6C22.1 11.2 21 13.5 21 16C21 18.5 22.1 20.8 24 22.4C25.9 20.8 27 18.5 27 16C27 13.5 25.9 11.2 24 9.6Z"
                      fill="#FF5F00"
                    />
                  </svg>
                </div>

                {/* American Express */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-6" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="2" fill="#006FCF" />
                    <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="white"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      AMEX
                    </text>
                  </svg>
                </div>

                {/* Discover */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-6" viewBox="0 0 48 16" fill="none">
                    <rect width="48" height="16" rx="2" fill="#FF6000" />
                    <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="white"
                      fontSize="7"
                      fontWeight="bold"
                    >
                      DISCOVER
                    </text>
                  </svg>
                </div>

                {/* PayPal */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-5" viewBox="0 0 48 16" fill="none">
                    <path
                      d="M18.5 3.5C20.5 3.5 21.8 4.8 21.5 7C21.2 9.2 19.5 10.5 17.5 10.5H16L16.8 5.5C16.9 5 17.3 4.5 17.8 4.5H18.5ZM14 2C13.5 2 13.1 2.3 13 2.8L11 14H13.5L14.3 9H16.3C19.5 9 22 7 22.5 4C23 1 21 2 18.5 2H14Z"
                      fill="#003087"
                    />
                    <path
                      d="M27 3.5C29 3.5 30.3 4.8 30 7C29.7 9.2 28 10.5 26 10.5H24.5L25.3 5.5C25.4 5 25.8 4.5 26.3 4.5H27ZM22.5 2C22 2 21.6 2.3 21.5 2.8L19.5 14H22L22.8 9H24.8C28 9 30.5 7 31 4C31.5 1 29.5 2 27 2H22.5Z"
                      fill="#0070E0"
                    />
                  </svg>
                </div>

                {/* Apple Pay */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-5" viewBox="0 0 48 20" fill="none">
                    <path
                      d="M10.5 5.2C11.1 4.4 11.5 3.3 11.4 2.2C10.4 2.3 9.2 2.9 8.5 3.7C7.9 4.4 7.4 5.5 7.6 6.5C8.7 6.6 9.8 6 10.5 5.2ZM11.4 6.8C9.8 6.7 8.4 7.7 7.7 7.7C7 7.7 5.8 6.9 4.5 6.9C2.8 7 1.2 7.9 0.3 9.4C-1.5 12.4 -0.1 16.9 1.6 19.4C2.5 20.6 3.5 22 4.8 21.9C6.1 21.9 6.5 21.2 8 21.2C9.5 21.2 9.9 21.9 11.2 21.9C12.5 21.9 13.4 20.6 14.3 19.4C15.3 18 15.7 16.6 15.7 16.5C15.7 16.5 13.2 15.5 13.2 12.6C13.2 10.1 15.2 9 15.3 8.9C14.1 7.1 12.3 6.9 11.4 6.8Z"
                      fill="black"
                    />
                    <text x="32" y="14" fill="black" fontSize="10" fontWeight="500">
                      Pay
                    </text>
                  </svg>
                </div>

                {/* Google Pay */}
                <div className="bg-white rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-5" viewBox="0 0 48 20" fill="none">
                    <path
                      d="M23.5 9.5V13H22V5H25.3C26.2 5 27 5.3 27.6 5.9C28.2 6.5 28.5 7.3 28.5 8.2C28.5 9.1 28.2 9.9 27.6 10.5C27 11.1 26.2 11.4 25.3 11.4H23.5V9.5ZM23.5 6.5V8H25.3C25.8 8 26.2 7.8 26.5 7.5C26.8 7.2 27 6.8 27 6.3C27 5.8 26.8 5.4 26.5 5.1C26.2 4.8 25.8 4.6 25.3 4.6H23.5V6.5ZM33 9.9C33 10.4 32.9 10.8 32.8 11.2H29.3C29.4 11.6 29.6 11.9 29.9 12.1C30.2 12.3 30.6 12.4 31 12.4C31.6 12.4 32.1 12.2 32.4 11.8L32.9 12.7C32.6 13 32.3 13.2 31.9 13.3C31.5 13.4 31.1 13.5 30.6 13.5C29.8 13.5 29.1 13.2 28.6 12.7C28.1 12.2 27.8 11.5 27.8 10.7C27.8 9.9 28.1 9.2 28.6 8.7C29.1 8.2 29.8 7.9 30.5 7.9C31.2 7.9 31.8 8.2 32.3 8.6C32.8 9.1 33 9.7 33 10.4V9.9ZM30.5 8.9C30.2 8.9 29.9 9 29.7 9.2C29.5 9.4 29.3 9.7 29.3 10H31.6C31.6 9.7 31.5 9.4 31.3 9.2C31.1 9 30.8 8.9 30.5 8.9ZM36.2 8L35.7 9.3C35.5 9.2 35.3 9.2 35 9.2C34.4 9.2 34 9.7 34 10.6V13H32.5V8H34V8.8C34.3 8.2 34.8 7.9 35.5 7.9C35.7 7.9 36 8 36.2 8Z"
                      fill="#5F6368"
                    />
                    <path
                      d="M19.7 10.7C19.7 11.5 19.5 12.2 19 12.7C18.5 13.2 17.9 13.5 17.1 13.5C16.3 13.5 15.7 13.2 15.2 12.7C14.7 12.2 14.5 11.5 14.5 10.7C14.5 9.9 14.7 9.2 15.2 8.7C15.7 8.2 16.3 7.9 17.1 7.9C17.9 7.9 18.5 8.2 19 8.7C19.5 9.2 19.7 9.9 19.7 10.7ZM18.2 10.7C18.2 10.2 18.1 9.8 17.8 9.5C17.5 9.2 17.2 9 16.8 9C16.4 9 16.1 9.2 15.8 9.5C15.5 9.8 15.4 10.2 15.4 10.7C15.4 11.2 15.5 11.6 15.8 11.9C16.1 12.2 16.4 12.4 16.8 12.4C17.2 12.4 17.5 12.2 17.8 11.9C18.1 11.6 18.2 11.2 18.2 10.7Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M20.8 10.7C20.8 9.9 21 9.2 21.5 8.7C22 8.2 22.6 7.9 23.4 7.9C24.2 7.9 24.8 8.2 25.3 8.7C25.8 9.2 26 9.9 26 10.7C26 11.5 25.8 12.2 25.3 12.7C24.8 13.2 24.2 13.5 23.4 13.5C22.6 13.5 22 13.2 21.5 12.7C21 12.2 20.8 11.5 20.8 10.7ZM24.5 10.7C24.5 10.2 24.4 9.8 24.1 9.5C23.8 9.2 23.5 9 23.1 9C22.7 9 22.4 9.2 22.1 9.5C21.8 9.8 21.7 10.2 21.7 10.7C21.7 11.2 21.8 11.6 22.1 11.9C22.4 12.2 22.7 12.4 23.1 12.4C23.5 12.4 23.8 12.2 24.1 11.9C24.4 11.6 24.5 11.2 24.5 10.7Z"
                      fill="#EA4335"
                    />
                    <path d="M8 6.5V15H6.5V11.5H3.5V15H2V6.5H3.5V10H6.5V6.5H8Z" fill="#34A853" />
                    <path
                      d="M11 11.5C11.4 11.5 11.7 11.4 12 11.2L12.7 12.2C12.2 12.6 11.6 12.8 10.9 12.8C10.1 12.8 9.5 12.5 9 12C8.5 11.5 8.3 10.8 8.3 10C8.3 9.2 8.5 8.5 9 8C9.5 7.5 10.1 7.2 10.8 7.2C11.5 7.2 12.1 7.5 12.5 8C13 8.5 13.2 9.2 13.2 10V10.5H9.8C9.9 11 10.1 11.3 10.4 11.5C10.7 11.7 11 11.8 11.4 11.8L11 11.5ZM9.8 9.5H11.7C11.7 9.2 11.6 8.9 11.4 8.7C11.2 8.5 10.9 8.4 10.6 8.4C10.3 8.4 10.1 8.5 9.9 8.7C9.8 8.9 9.7 9.2 9.8 9.5Z"
                      fill="#FBBC04"
                    />
                  </svg>
                </div>

                {/* Venmo */}
                <div className="bg-[#3D95CE] rounded-lg p-2.5 h-11 flex items-center justify-center shadow-sm">
                  <svg className="h-4" viewBox="0 0 48 16" fill="none">
                    <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="white"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      venmo
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Find Us On */}
            <div className="mb-8">
              <h3 className="text-[16px] sm:text-[17px] md:text-[18px] font-bold mb-4 sm:mb-5 md:mb-6 tracking-wide">
                FIND US ON
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="Pinterest"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="Threads"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.186 3.998c-.93 0-3.414.121-4.78 1.993-.364.498-.61 1.054-.731 1.655l1.727.398c.084-.414.242-.8.47-1.145.85-1.163 2.395-1.256 3.314-1.256 1.017 0 2.106.139 2.866.865.536.512.792 1.238.792 2.159 0 .438-.065.79-.196 1.081-.326-.033-.672-.054-1.039-.054-2.766 0-5.558.894-5.558 4.126 0 1.711 1.168 3.18 2.708 3.18 1.369 0 2.169-.63 2.674-1.227.208.549.601.997 1.13 1.297.68.385 1.522.546 2.294.546 1.732 0 3.158-.523 4.005-1.471.766-.857 1.158-1.987 1.158-3.35 0-2.165-.701-3.774-2.027-4.653-1.227-.812-2.866-1.144-4.807-1.144zm-.149 7c-1.303 0-2.224.474-2.224 1.476 0 .627.539 1.474 2.064 1.474 1.196 0 2.061-.493 2.061-1.474 0-.983-.866-1.476-1.901-1.476z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/ahmedmmordi/re-use"
                  className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all duration-200"
                  aria-label="Snapchat"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3 0 .605-.1.836-.206.084-.037.169-.07.257-.1.433-.15.829-.177 1.169-.177.579 0 .994.165 1.236.33a.245.245 0 01.088.263c-.06.195-.173.433-.332.752-.379.759-.851 1.704-1.229 2.155-.276.332-.609.586-.88.718-.257.126-.476.177-.665.177-.104 0-.191-.015-.268-.045-.046-.018-.086-.042-.12-.075-.079-.076-.154-.235-.154-.427 0-.16.055-.338.145-.558.146-.358.35-.866.35-1.493 0-.757-.411-1.395-1.193-1.395-.816 0-1.426.638-1.426 1.395 0 .627.204 1.135.35 1.493.09.22.145.398.145.558 0 .192-.075.351-.154.427-.034.033-.074.057-.12.075-.077.03-.164.045-.268.045-.189 0-.408-.051-.665-.177-.271-.132-.604-.386-.88-.718-.378-.451-.85-1.396-1.229-2.155-.159-.319-.272-.557-.332-.752a.245.245 0 01.088-.263c.242-.165.657-.33 1.236-.33.34 0 .736.027 1.169.177.088.03.173.063.257.1.231.106.536.206.836.206.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847 1.583-3.545 4.94-3.821 5.93-3.821z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mb-4"></div>
        {/* Bottom Bar */}
        <div className="space-y-3">
          {/* Logo + Location and Legal Links */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Logo + Location */}
            <div className="flex items-center gap-3">
              <h2
                className="text-[36px] font-normal italic"
                style={{ fontFamily: "'Pacifico', cursive" }}
              >
                ReUse
              </h2>
              <div className="flex items-center gap-1 text-gray-400 text-[13px]">
                <MapPin className="w-4 h-4" />
                <span>Cairo, Egypt</span>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center gap-4 text-[13px]">
              <span className="text-gray-400">© 2026 ReUse</span>
              <span className="text-gray-600">•</span>
              <a
                href="#"
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="#"
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="#"
                className="text-gray-300 hover:text-white hover:underline transition-colors"
              >
                Cookie Preferences
              </a>
            </div>
          </div>

          {/* Tagline */}
          <div className="text-gray-500 text-[12px]">
            Your trusted marketplace for second-hand goods in Egypt
          </div>
        </div>
      </div>
    </footer>
  );
}
