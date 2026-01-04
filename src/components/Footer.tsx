import React from 'react';
import {
    ExternalLink,
    Sparkles,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    ShieldCheck
} from 'lucide-react';
import { cn } from "@/lib/utils";

const Footer = () => {
    const socialLinks = [
        { icon: Facebook, href: "https://www.facebook.com/alkhatib.marketing/" },
        { icon: Instagram, href: "https://www.instagram.com/alkhatib.marketing/" },
        { icon: Twitter, href: "https://twitter.com/alkhatib_mkt" },
        { icon: Linkedin, href: "https://www.linkedin.com/company/alkhatib-marketing/" },
    ];

    return (
        <footer className="w-full py-6 px-6 mt-auto border-t border-border/40 bg-card/20 backdrop-blur-md z-50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">

                {/* Column 1: Brand & Icons */}
                <div className="flex flex-col items-center md:items-start gap-6">
                    {/* Brand */}
                    <a
                        href="https://alkhatib-marketing.great-site.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 group cursor-pointer"
                    >
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                            <img
                                src="/logo.png"
                                alt="Al-Khatib Logo"
                                className="relative h-14 w-14 rounded-full border-2 border-white/10 shadow-2xl object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://alkhatib-marketing.great-site.net/favicon.ico';
                                }}
                            />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black tracking-tighter bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-amber-500 transition-all duration-500 flex items-center gap-2">
                                AL-KHATIB-MARKETING&SOFTWEAR
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                            </h2>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Sparkles className="h-3 w-3 text-amber-500 animate-spin-slow" />
                                Premium Digital Solutions
                            </div>
                        </div>
                    </a>

                    {/* Social Icons (Moved Here) */}
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social, index) => (
                            <a
                                key={index}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full border border-orange-500/30 text-orange-500 transition-all duration-500 hover:scale-110 hover:border-orange-500 hover:bg-orange-500 hover:text-white hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] group"
                            >
                                <social.icon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-[360deg]" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Column 2: Company Brief */}
                <div className="flex flex-col items-center md:items-start gap-3 max-w-lg text-center md:text-right">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-5 w-5 text-orange-500 animate-pulse" />
                        <h3 className="font-bold text-foreground/90">عن الشركة</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        نقدم حلولاً برمجية وتسويقية متكاملة، من تطوير الأنظمة وتطبيقات الويب إلى استراتيجيات التسويق الرقمي المتقدمة. شركة الخطيب شريككم الاستراتيجي للنمو والابتكار الرقمي.
                    </p>
                    <div className="text-[10px] font-medium text-muted-foreground/60 mt-2">
                        <span>© {new Date().getFullYear()} All Rights Reserved</span>
                        <span className="mx-2">|</span>
                        <span className="italic">Crafted with Love in Jordan 🇯🇴</span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
