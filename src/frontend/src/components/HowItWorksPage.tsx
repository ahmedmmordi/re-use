import { useNavigate } from "react-router";
import {
  UserPlus,
  Search,
  ShoppingBag,
  MessageCircle,
  Package,
  Star,
  Shield,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  CheckCircle,
} from "lucide-react";

const buyerSteps = [
  {
    icon: UserPlus,
    title: "Create a free account",
    description: "Sign up in seconds. No subscription fees — ever.",
  },
  {
    icon: Search,
    title: "Browse & discover",
    description: "Search pre-loved items and filter by category, condition, location, or price.",
  },
  {
    icon: MessageCircle,
    title: "Message the seller",
    description: "Ask questions, negotiate, or arrange a local meet-up — all in the app.",
  },
  {
    icon: ShoppingBag,
    title: "Meet & buy",
    description: "Agree on a handover in your city and pay the seller directly when you meet.",
  },
  {
    icon: Star,
    title: "Leave a review",
    description: "Rate your experience to help build a trusted community.",
  },
];

const sellerSteps = [
  {
    icon: UserPlus,
    title: "Create a free account",
    description: "Your seller profile is your shopfront — add a photo and a short bio.",
  },
  {
    icon: Package,
    title: "List your item",
    description: "Take a few photos, write a description, set a price. Done in under two minutes.",
  },
  {
    icon: MessageCircle,
    title: "Chat with buyers",
    description: "Answer questions and agree on details before the sale.",
  },
  {
    icon: RefreshCw,
    title: "Arrange the handover",
    description: "Agree on a local meet-up in your city and hand the item over in person.",
  },
  {
    icon: CheckCircle,
    title: "Close the deal",
    description: "Settle payment directly with the buyer and mark your listing as sold.",
  },
];

const faqs = [
  {
    q: "Is ReUse free to use?",
    a: "Yes. Creating an account, browsing, listing items, and messaging are all free. Buyers and sellers settle payment directly between themselves.",
  },
  {
    q: "How do buyers and sellers connect?",
    a: "Message the seller in the app to ask questions and agree on details, then arrange a local meet-up in your city to complete the deal.",
  },
  {
    q: "Where do deals happen?",
    a: "Listings show the seller's city, and you arrange a local handover with the seller when you meet.",
  },
  {
    q: "What can I sell on ReUse?",
    a: "Clothing, accessories, electronics, home goods, collectibles, sports equipment and more, organised by category.",
  },
  {
    q: "How do I know sellers are trustworthy?",
    a: "Every user has a public profile with reviews and ratings from past deals. You can also report any listing or user that looks suspicious.",
  },
];

export function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">How ReUse Works</h1>
          <p className="text-base sm:text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed">
            Buying and selling pre-loved items has never been simpler — or safer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8">
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto bg-white text-[#3d2e7c] px-8 py-3 rounded-full font-semibold hover:bg-purple-50 transition-colors"
            >
              Get started free
            </button>
            <button
              onClick={() => navigate("/products")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/40 px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              Browse listings <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20">
        {/* Buyer flow */}
        <section>
          <div className="text-center mb-12">
            <span className="inline-block bg-purple-100 text-[#4B0082] text-sm font-semibold px-4 py-1 rounded-full mb-3">
              For buyers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Find something you'll love
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {buyerSteps.map((step, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-[#4B0082]" />
                </div>
                <span className="absolute top-4 right-4 text-xs font-bold text-gray-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Seller flow */}
        <section>
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-3">
              For sellers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Turn clutter into cash</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {sellerSteps.map((step, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-green-700" />
                </div>
                <span className="absolute top-4 right-4 text-xs font-bold text-gray-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] rounded-2xl p-6 sm:p-10 text-white grid md:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: Star,
              heading: "Real reviews",
              body: "Honest ratings from real buyers and sellers build community trust.",
            },
            {
              icon: Shield,
              heading: "Report & moderation",
              body: "Flag anything that looks off — our team reviews reported listings and users.",
            },
            {
              icon: MessageCircle,
              heading: "Direct messaging",
              body: "Chat with the other party to agree on details before you meet.",
            },
          ].map(({ icon: Icon, heading, body }) => (
            <div key={heading} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{heading}</h3>
              <p className="text-purple-200 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group bg-white rounded-xl border border-gray-200">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-6 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="w-5 h-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of people already buying and selling on ReUse.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white px-10 py-4 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Create your free account
          </button>
        </section>
      </div>
    </div>
  );
}
