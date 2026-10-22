import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  CarFront,
  ArrowUpRight,
  Menu,
} from "lucide-react";

function Home() {
  return (
    <div className="home-page">
      {/* Navigation */}
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <CarFront size={24} />
          </span>
          RideFlow<span className="brand-dot">.</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <a href="#services">Services</a>
          <a href="#about">About Us</a>
        </nav>

        <div className="nav-actions">
          {/* Rider Login */}
          <Link to="/rider/login" className="nav-login">
            Log In
          </Link>

          {/* Rider Registration */}
          <Link to="/rider/register" className="nav-signup">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>

        <button className="mobile-menu" aria-label="Open menu">
          <Menu size={24} />
        </button>
      </header>

      {/* Hero Section */}
      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              YOUR CITY. YOUR RIDE.
            </div>

            <h1>
              Move freely.
              <br />
              <span>Arrive happy.</span>
            </h1>

            <p className="hero-description">
              Your next ride is just a few clicks away.
              Book a comfortable cab and get where you need
              to be, without the hassle.
            </p>

            <div className="hero-actions">
              {/* Book a Ride */}
              <Link
                to="/rider/login"
                className="primary-button hero-button"
              >
                Book a Ride <ArrowRight size={18} />
              </Link>

              <a href="#services" className="secondary-button">
                Explore Services <ArrowUpRight size={18} />
              </a>
            </div>

            <div className="hero-benefits">
              <div>
                <ShieldCheck size={19} />
                <span>Safe rides</span>
              </div>

              <div>
                <Clock size={19} />
                <span>Easy booking</span>
              </div>

              <div>
                <Navigation size={19} />
                <span>Live updates</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="visual-label">
              <span className="live-dot"></span>
              READY FOR YOUR NEXT TRIP
            </div>

            <div className="car-image-container">
              <img
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85"
                alt="Modern car ready for a comfortable journey"
                className="hero-car-image"
              />
            </div>

            <div className="floating-card location-card">
              <div className="floating-icon pickup-icon">
                <MapPin size={19} />
              </div>

              <div>
                <span className="floating-label">
                  YOUR PICKUP
                </span>
                <strong>Choose your location</strong>
              </div>
            </div>

            <div className="floating-card ride-card">
              <div className="floating-icon ride-icon">
                <CarFront size={20} />
              </div>

              <div>
                <strong>Your next ride</strong>
                <span>Comfort is on the way.</span>
              </div>
            </div>

            <div className="visual-decoration decoration-one"></div>
            <div className="visual-decoration decoration-two"></div>
          </div>
        </section>

        {/* Booking Callout */}
        <section className="booking-callout">
          <div className="booking-callout-text">
            <span className="section-eyebrow">
              LET'S GET YOU THERE
            </span>

            <h2>Where would you like to go?</h2>

            <p>
              Start your journey with a quick and easy booking.
            </p>
          </div>

          <Link
            to="/rider/login"
            className="primary-button booking-button"
          >
            Start Booking <ArrowRight size={18} />
          </Link>
        </section>

        {/* Services */}
        <section className="services-section" id="services">
          <div className="section-heading">
            <span className="section-eyebrow">
              THE RIDEFLOW EXPERIENCE
            </span>

            <h2>Travel made simple.</h2>

            <p>
              Everything you need for a smoother journey,
              designed around you.
            </p>
          </div>

          <div className="service-grid">
            {/* Service 1 */}
            <article className="service-card">
              <div className="service-icon blue-icon">
                <CarFront size={25} />
              </div>

              <h3>Easy Booking</h3>

              <p>
                Book your ride in just a few steps and
                spend less time waiting.
              </p>

              <Link to="/rider/login" className="service-link">
                Book a ride <ArrowRight size={16} />
              </Link>
            </article>

            {/* Service 2 */}
            <article className="service-card">
              <div className="service-icon purple-icon">
                <Navigation size={25} />
              </div>

              <h3>Real-Time Updates</h3>

              <p>
                Stay informed about your ride status as
                your journey progresses.
              </p>

              <span className="service-note">
                Live updates available during rides
              </span>
            </article>

            {/* Service 3 */}
            <article className="service-card">
              <div className="service-icon green-icon">
                <ShieldCheck size={25} />
              </div>

              <h3>Travel with Confidence</h3>

              <p>
                Access your driver and ride details
                in one convenient place.
              </p>

              <span className="service-note">
                Your journey, made easier
              </span>
            </article>
          </div>
        </section>

        {/* About */}
        <section className="about-section" id="about">
          <div>
            <span className="section-eyebrow">
              A BETTER WAY TO MOVE
            </span>

            <h2>
              Every journey deserves a better experience.
            </h2>
          </div>

          <div className="about-content">
            <p>
              RideFlow brings booking, ride updates, and
              journey details together in one simple experience.
              Whether you're heading to work or exploring your
              city, getting there should feel effortless.
            </p>

            <Link to="/rider/register" className="primary-button">
              Join RideFlow <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <CarFront size={22} />
          </span>

          RideFlow<span className="brand-dot">.</span>
        </Link>

        <p>Making every journey a little easier.</p>

        <span className="copyright">
          © {new Date().getFullYear()} RideFlow. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default Home;