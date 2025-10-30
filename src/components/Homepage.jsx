import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  PlayCircle,
  ArrowRight,
  Menu,
  X,
  Star,
  Clock,
  Target,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Homepage({ session, userProfile }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      title: "Live Scoring",
      description:
        "Score matches in real-time with instant updates and professional scorecards",
      icon: "🏏",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Tournament Management",
      description:
        "Organize and manage tournaments with automated brackets and scheduling",
      icon: "🏆",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Multi-Sport Support",
      description:
        "Cricket, Football, Basketball, Tennis and more sports with dedicated scoring",
      icon: "⚽",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Team Analytics",
      description:
        "Detailed statistics and performance analytics for players and teams",
      icon: "📊",
      color: "from-orange-500 to-orange-600",
    },
  ];

  const stats = [
    { number: "10K+", label: "Matches Scored" },
    { number: "500+", label: "Tournaments" },
    { number: "50K+", label: "Players" },
    { number: "15+", label: "Sports Supported" },
  ];

  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Tournament Organizer",
      message:
        "All Sports Live made organizing our cricket tournament incredibly easy. The real-time scoring kept everyone engaged!",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Team Captain",
      message:
        "The best sports scoring app I've used. Clean interface and works perfectly during live matches.",
      rating: 5,
    },
    {
      name: "Ahmed Khan",
      role: "Sports Enthusiast",
      message:
        "Love how I can track all my favorite sports in one place. The statistics feature is amazing!",
      rating: 5,
    },
  ];

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  All Sports Live
                </h1>
                <p className="text-xs text-slate-400">Your Sports Matter</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => navigate("/quick-match")}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg"
              >
                Start Scoring
              </button>

              {session ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-800 hover:border-slate-500 transition-all duration-200 font-medium"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 border-t border-slate-700/50">
              <div className="flex flex-col space-y-2 pt-4">
                <button
                  onClick={() => {
                    navigate("/quick-match");
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 text-left hover:bg-slate-800 rounded-xl transition-colors text-green-400 font-medium"
                >
                  🚀 Start Scoring
                </button>
                {session ? (
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 text-left hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-xl"></div>

        <div className="relative max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              We make every
              <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                sports moment
              </span>
              <span className="block">legendary</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Score matches live, organize tournaments, and track statistics for
              all your favorite sports. One platform, unlimited possibilities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => navigate("/quick-match")}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <PlayCircle size={24} />
              <span>Start Scoring Free</span>
            </button>

            {!session && (
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 border-2 border-slate-600 text-slate-300 rounded-2xl hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 font-semibold text-lg flex items-center space-x-2"
              >
                <Users size={24} />
                <span>Join Community</span>
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                All Sports Live?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Everything you need to manage sports events, from quick matches to
              full tournaments
            </p>
          </div>

          {/* Feature Carousel */}
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 border border-slate-700/50">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-6xl mb-6">
                    {features[currentFeature].icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                    {features[currentFeature].description}
                  </p>
                  <button
                    onClick={() => navigate("/quick-match")}
                    className={`px-6 py-3 bg-gradient-to-r ${features[currentFeature].color} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200`}
                  >
                    Try It Now
                  </button>
                </div>
                <div className="relative">
                  <div
                    className={`w-full h-64 bg-gradient-to-br ${features[currentFeature].color} rounded-2xl flex items-center justify-center text-6xl`}
                  >
                    {features[currentFeature].icon}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={prevFeature}
                className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextFeature}
                className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-4 space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentFeature ? "bg-blue-500" : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">
            Trusted by Sports Communities Worldwide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50"
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-300 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">What Our Users Say</h2>

          <div className="relative">
            <div className="bg-slate-800 rounded-2xl p-8 md:p-12 border border-slate-700/50">
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 text-yellow-400 fill-current"
                      />
                    )
                  )}
                </div>
                <p className="text-xl md:text-2xl text-slate-200 italic leading-relaxed">
                  "{testimonials[currentTestimonial].message}"
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold">
                  {testimonials[currentTestimonial].name}
                </h4>
                <p className="text-slate-400">
                  {testimonials[currentTestimonial].role}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={prevTestimonial}
                className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextTestimonial}
                className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-4 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial
                      ? "bg-blue-500"
                      : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-12 border border-slate-700/50">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Make Your
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sports Legendary?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of organizers and players already using All Sports
              Live to create unforgettable sporting experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/quick-match")}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Start Scoring Now
              </button>

              {!session && (
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-4 border-2 border-slate-600 text-slate-300 rounded-2xl hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 font-semibold text-lg"
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  All Sports Live
                </h3>
                <p className="text-xs text-slate-400">Your Sports Matter</p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-slate-400 mb-2">
                © 2025 All Sports Live. Built for the future of sports.
              </p>
              <div className="flex justify-center md:justify-end space-x-6 text-sm text-slate-500">
                <button className="hover:text-slate-300 transition-colors">
                  Privacy
                </button>
                <button className="hover:text-slate-300 transition-colors">
                  Terms
                </button>
                <button className="hover:text-slate-300 transition-colors">
                  Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
