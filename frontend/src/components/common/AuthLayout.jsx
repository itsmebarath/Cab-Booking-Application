import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Zap } from "lucide-react";
import AppLogo from "./AppLogo";

/**
 * AuthLayout: Premium two-column layout for login and registration pages.
 * Responsive: Left visual showcase on desktop; elegant centered card on mobile/tablet.
 */
export default function AuthLayout({
  accountType = "RIDER", // "RIDER" | "DRIVER"
  title,
  subtitle,
  children,
  badgeText = null,
  visualTitle = null,
  visualSubtitle = null,
  benefits = [],
  footerPrompt = null,
  footerLink = null,
  alternateAccount = null,
}) {
  const defaultBenefits =
    accountType === "DRIVER"
      ? [
          {
            icon: Zap,
            title: "Flexible Earnings",
            desc: "Keep more of what you earn with transparent weekly payouts.",
          },
          {
            icon: MapPin,
            title: "Smart Route Matching",
            desc: "Optimized ride requests nearby to minimize your idle time.",
          },
          {
            icon: ShieldCheck,
            title: "Driver Safety First",
            desc: "24/7 dedicated driver support & verified passenger profiles.",
          },
        ]
      : [
          {
            icon: Zap,
            title: "Instant Booking",
            desc: "Get paired with top-rated nearby drivers in under 60 seconds.",
          },
          {
            icon: MapPin,
            title: "Live GPS Tracking",
            desc: "Real-time updates, accurate ETA, and transparent fare breakdowns.",
          },
          {
            icon: ShieldCheck,
            title: "Safe & Verified Rides",
            desc: "Strict driver verification and 24/7 emergency ride assistance.",
          },
        ];

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <div className="rf-auth-page">
      {/* Visual Showcase Panel (Desktop) */}
      <aside className="rf-auth-visual-panel" aria-hidden="true">
        <div className="rf-auth-visual-header">
          <AppLogo size="md" light={true} to="/" />
        </div>

        <div className="rf-auth-visual-body">
          <span className="rf-auth-visual-tag">
            {badgeText || `${accountType} PORTAL`}
          </span>

          <h1 className="rf-auth-visual-heading">
            {visualTitle || (
              <>
                Move freely.
                <br />
                <span className="rf-text-yellow">Ride on time.</span>
              </>
            )}
          </h1>

          <p className="rf-auth-visual-desc">
            {visualSubtitle ||
              "Experience the next generation of seamless city rides with RideFlow's fast, reliable, and fair mobility platform."}
          </p>

          <div className="rf-auth-benefits-list">
            {displayBenefits.map((b, idx) => {
              const IconComp = b.icon || CheckCircle2;
              return (
                <div key={idx} className="rf-auth-benefit-item">
                  <span className="rf-auth-benefit-icon">
                    <IconComp size={18} />
                  </span>
                  <div>
                    <h4 className="rf-auth-benefit-title">{b.title}</h4>
                    <p className="rf-auth-benefit-desc">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rf-auth-visual-footer">
          <p>© {new Date().getFullYear()} RideFlow Technologies Inc. All rights reserved.</p>
        </div>
      </aside>

      {/* Main Form Content Panel */}
      <main className="rf-auth-form-panel">
        <div className="rf-auth-top-nav">
          <Link to="/" className="rf-auth-back-link" aria-label="Back to home page">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="rf-auth-card">
          {/* Mobile Logo */}
          <div className="rf-auth-mobile-header">
            <AppLogo size="md" light={false} to="/" />
          </div>

          <div className="rf-auth-header">
            <span className="rf-auth-account-badge">
              {badgeText || `${accountType} ACCOUNT`}
            </span>
            <h2 className="rf-auth-title">{title}</h2>
            {subtitle && <p className="rf-auth-subtitle">{subtitle}</p>}
          </div>

          <div className="rf-auth-form-content">{children}</div>

          {/* Footer links */}
          {(footerPrompt || footerLink) && (
            <div className="rf-auth-footer">
              <span className="rf-auth-footer-prompt">{footerPrompt}</span>
              {footerLink && (
                <Link to={footerLink.to} className="rf-auth-footer-link">
                  {footerLink.text}
                </Link>
              )}
            </div>
          )}

          {alternateAccount && (
            <div className="rf-auth-alternate-box">
              <span>{alternateAccount.prompt || "Need another account?"}</span>
              <Link to={alternateAccount.to} className="rf-auth-alt-link">
                {alternateAccount.text}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
