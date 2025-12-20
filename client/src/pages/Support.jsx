import { useState, useEffect, useRef } from "react";
import PageMeta from "../components/common/PageMeta";
import { useSettings } from "../context/SettingContext";
import api from "../api/axios";
import {
  HelpCircle,
  MessageCircle,
  FileText,
  Shield,
  Send,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Heart,
  Users,
  CheckCircle,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const { settings } = useSettings();
  const [openFaq, setOpenFaq] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("api/support", { name, email, subject, type, message });
      if (res?.data?.success) {
        setStatus({ ok: true, msg: "Submitted successfully! We'll get back to you soon." });
        setName(""); setEmail(""); setSubject(""); setType("feedback"); setMessage("");
      } else {
        setStatus({ ok: false, msg: res?.data?.message || "Submission failed" });
      }
    } catch (err) {
      setStatus({ ok: false, msg: "Failed to submit. Please try again." });
      console.error("Support submit error", err);
    }
  };

  const faqIcons = [HelpCircle, MessageCircle, FileText, Shield];

  // CountUp Animation Component
  const CountUp = ({ end, suffix = "", decimals = 0, isLoaded }) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
      if (!isLoaded || hasAnimated.current) return;
      
      hasAnimated.current = true;
      const duration = 2000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = easeOutQuart * end;
        
        setCount(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [end, isLoaded]);

    return <span ref={countRef}>{count.toFixed(decimals)}{suffix}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
      <PageMeta title="Support" description="Get help and support" />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-primary/10 dark:bg-primary/5 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Hero Section */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">We're here to help</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent mb-4">
            Support Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions or reach out to our team for personalized assistance.
          </p>
        </div>

        {/* About Us Section */}
        <div className={`mb-12 transition-all duration-700 delay-100 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/80 via-primary to-secondary p-8 md:p-12 text-white">
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {settings?.about?.title || "About Us"}
                </h2>
                <p className="text-white/90 text-lg leading-relaxed whitespace-pre-line">
                  {settings?.about?.content || "We are a restaurant dedicated to great food and exceptional service. Our passion is creating memorable dining experiences for every guest."}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Heart, label: "Made with Love", value: 100, suffix: "%" },
                  { icon: Users, label: "Happy Customers", value: 10, suffix: "K+" },
                  { icon: Clock, label: "Years Experience", value: 5, suffix: "+" },
                  { icon: CheckCircle, label: "Quality Rating", value: 4.9, suffix: "★", decimals: 1 },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition-all duration-300">
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-white/80" />
                    <div className="text-2xl font-bold">
                      <CountUp 
                        end={stat.value} 
                        suffix={stat.suffix} 
                        decimals={stat.decimals || 0}
                        isLoaded={isLoaded}
                      />
                    </div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className={`mb-12 transition-all duration-700 delay-200 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Quick answers to common questions</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-start">
            {(settings?.faqs || []).map((faq, idx) => {
              const IconComponent = faqIcons[idx % faqIcons.length];
              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 ${openFaq === idx ? "ring-2 ring-primary/20" : ""}`}
                >
                  <button
                    className="w-full text-left p-5 flex items-start gap-4"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary dark:text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 dark:text-white block pr-8">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-5 pb-5 pl-19 text-gray-600 dark:text-gray-400 leading-relaxed" style={{ paddingLeft: "4.5rem" }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!settings?.faqs || settings.faqs.length === 0) && (
              <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No FAQs available at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Policies Section - Compact Collapsible */}
        <div className={`mb-12 transition-all duration-700 delay-300 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden">
            {/* Policy Tabs */}
            <div className="flex">
              {[
                { id: "terms", label: "Terms of Service", icon: FileText },
                { id: "privacy", label: "Privacy Policy", icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePolicy(activePolicy === tab.id ? null : tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all duration-300 ${
                    activePolicy === tab.id
                      ? "bg-gradient-to-r from-primary to-secondary text-white"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-base font-semibold">{tab.label}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activePolicy === tab.id ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>

            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-300 ${activePolicy ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="p-6 max-h-[350px] overflow-y-auto">
                <div className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed text-sm">
                  {activePolicy === "terms" 
                    ? (settings?.policies?.terms || "Terms of service content will appear here.")
                    : (settings?.policies?.privacy || "Privacy policy content will appear here.")
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section - 2 Column Layout */}
        <div className={`grid lg:grid-cols-5 gap-8 transition-all duration-700 delay-400 ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-3xl p-6 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get in Touch</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">We'd love to hear from you</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-300"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-300"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-300"
                      placeholder="How can we help?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-300"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="feedback">💬 Feedback</option>
                      <option value="complaint">⚠️ Complaint</option>
                      <option value="other">📝 Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-300 resize-none"
                    placeholder="Tell us more about your inquiry..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                  {status && (
                    <span className={`text-sm font-medium ${status.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {status.msg}
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 md:p-8 text-white h-full">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                {[
                  { icon: Mail, label: "Email Us", value: settings?.email || "support@restaurant.com", href: `mailto:${settings?.email || "support@restaurant.com"}` },
                  { icon: Phone, label: "Call Us", value: settings?.phone || "+1 234 567 890", href: `tel:${settings?.phone || "+1234567890"}` },
                  { icon: MapPin, label: "Visit Us", value: settings?.address || "123 Restaurant Street", href: null },
                  { icon: Clock, label: "Working Hours", value: "Mon-Sun: 10AM - 11PM", href: null },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors duration-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm text-white/60 mb-1">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-white hover:text-primary transition-colors duration-300">
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-white">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/60 text-sm mb-4">Follow us on social media</p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                    title="Facebook"
                  >
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href="#"
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href="#"
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-gray-500/30 transition-all duration-300"
                    title="Twitter / X"
                  >
                    <Twitter className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
