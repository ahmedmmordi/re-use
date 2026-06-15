import heroImage from "../assets/hero.png";
import { useNavigate } from "react-router";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[350px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Vintage furniture and items for sale"
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="min-h-[350px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] flex items-center">
          <div className="max-w-[700px] py-16 sm:py-24 md:py-32">
            <h1 className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[76px] xl:text-[88px] font-bold text-white leading-[1.1] mb-4 sm:mb-6 md:mb-8 tracking-tight">
              Ready for a<br />
              Better Deal?
            </h1>

            <p className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] text-white/95 leading-relaxed mb-8 sm:mb-10 md:mb-12 max-w-[560px] font-normal">
              Discover unique pre-loved items and give them a new home. Sell what you don't need and
              find treasures you'll love.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
              {/* Sell Now Button */}
              <button
                onClick={() => navigate("/create-product")}
                className="bg-[#4169E1] text-white text-[15px] sm:text-[16px] md:text-[17px] font-semibold px-8 sm:px-10 md:px-12 py-4 sm:py-4.5 md:py-5 rounded-xl hover:bg-[#3557c7] hover:shadow-2xl transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5"
              >
                Sell Now
              </button>

              {/* Learn How It Works Link */}
              <button
                onClick={() => navigate("/how-it-works")}
                className="bg-white/10 backdrop-blur-sm text-white text-[15px] sm:text-[16px] md:text-[17px] font-semibold px-8 sm:px-10 md:px-12 py-4 sm:py-4.5 md:py-5 hover:bg-white/20 transition-all duration-200 border-2 border-white/40 hover:border-white rounded-xl hover:scale-[1.03] hover:-translate-y-0.5"
              >
                Learn How It Works
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
