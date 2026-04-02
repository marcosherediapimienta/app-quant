import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const features = [
    {
      title: 'Macro Analysis',
      description: 'Macroeconomic factors and their correlations with your portfolio',
      link: '/macro',
    },
    {
      title: 'Portfolio',
      description: 'Investment portfolio construction and optimization',
      link: '/portfolio',
    },
    {
      title: 'Risk Management',
      description: 'VaR, Expected Shortfall, drawdown and performance ratios',
      link: '/risk',
    },
    {
      title: 'CAPM',
      description: 'Capital Asset Pricing Model and portfolio optimization',
      link: '/capm',
    },
    {
      title: 'Valuation',
      description: 'Company valuation and sector comparative analysis',
      link: '/valuation',
    },
  ];

  return (
    <div className="home">
      <section className="home-hero">
        <div className="hero-inner">
          <h1 className="home-title">Gala Analytics</h1>
          <p className="home-description">
            Portfolio Management App
          </p>
          <div className="hero-cta">
            <a href="#about" className="cta-button secondary">
              About
            </a>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          {features.map((feature, index) => (
            <Link
              key={feature.link}
              to={feature.link}
              className="feature-card"
              style={{ animationDelay: `${index * 0.07}s` }}
            >
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <span className="feature-link-text">
                Open
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-card-main">
            <div className="about-header">
              <div className="about-avatar">👨‍💻</div>
              <div className="about-info">
                <h2 className="about-name">Marcos</h2>
                <p className="about-role">Data Scientist | MSc in Quantitative Finance</p>
              </div>
            </div>
            <div className="about-expertise">
              <div className="expertise-tags">
                <span className="expertise-tag">Financial Risk Analysis</span>
                <span className="expertise-tag">Time Series Forecasting</span>
                <span className="expertise-tag">Quantitative Modeling</span>

                <span className="expertise-tag">Machine Learning</span>
                <span className="expertise-tag">Portfolio Optimization</span>
              </div>
            </div>
          </div>

          <div className="about-links-card">
            <div className="about-links">
              <a
                href="https://github.com/marcosherediapimienta"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/marcosherediapimienta"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="mailto:marcosherediapimienta@gmail.com"
                className="social-link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z"/>
                </svg>
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
