import { useState } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/HomePageImage1.png'
import PaymentModal from '../components/paymentModal'
import './Home.css'

const VALUE_PROPS = [
  { title: 'Track',
    copy:
      'Unify public labor, wage, and education data with CareerRise apprenticeship outcomes for a single view of regional mobility.',
  },
  {
    title: 'Visualize',
    copy:
      'Dive into dashboards, whiteboards, and interactive maps that surface neighborhood trends and emerging opportunities.',
  },
  {
    title: 'Act',
    copy:
      'Pinpoint priority communities, partners, and programming so every investment accelerates economic mobility.',
  },
]

const STATS = [
  { label: 'Youth apprentices placed', value: '1,250+', hint: 'Tracked across Metro Atlanta industry clusters.' },
  { label: 'Median wage lift', value: '23%', hint: 'Measured six months after program completion.' },
  { label: 'Communities served', value: '38', hint: 'Neighborhoods prioritized through equity scoring.' },
  { label: 'Employer partners', value: '180+', hint: 'Anchored by sector-based apprenticeship models.' },
]

const STEPS = [
  {
    title: 'Collect Trusted Data',
    copy: 'Automate refreshes from Census, BLS, ARC, and CareerRise systems to keep insights current.',
  },
  {
    title: 'Surface Insights',
    copy: 'Blend quantitative and qualitative signals to reveal gaps, opportunities, and partnership needs.',
  },
  {
    title: 'Mobilize Investments',
    copy: 'Share saved scenarios and collaborate on next steps to align funders, employers, and community partners.',
  },
]

const STAKEHOLDERS = [
  {
    title: 'Employers',
    copy: 'Discover talent pipelines, measure apprenticeship ROI, and target industries for growth.',
  },
  {
    title: 'Community Partners',
    copy: 'Understand neighborhood needs and coordinate services that lift residents into career pathways.',
  },
  {
    title: 'Funders & Policy Makers',
    copy: 'See the stories behind the data to champion good jobs and equitable investments.',
  },
]

const CTA_LINKS = [
  { to: '/dashboard', label: 'View Dashboard' },
  { to: '/map', label: 'Explore Map' },
  { to: '/saved-graphs', label: 'Saved Graphs' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/login', label: 'Login' },
  { to: '/sign-up', label: 'Sign Up' },
  { to: '/contact', label: 'Contact CareerRise' },
]

function Home() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  return (
    <div className="home">
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
      <section className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-content">
            <p className="home__eyebrow">CareerRise Mobility Intelligence</p>
            <h1 className="home__headline">When Workforce Works, Communities Thrive!</h1>
            <p className="home__subheadline">
              A technology solution that tracks, visualizes, and analyzes public and internal economic mobility metrics
              across the Atlanta Metro Area so CareerRise can identify where to target investments and programming.
            </p>
            <p className="home__mission">
              CareerRise is expanding access to opportunities and resources that promote economic mobility, support
              skilled workers, and champion good jobs.
            </p>
            <div className="home__cta-buttons">
              <Link to="/dashboard" className="home__button home__button--primary">
                Open Mobility Dashboard
              </Link>
              <Link to="/map" className="home__button home__button--secondary">
                Explore the Map
              </Link>
            </div>
          </div>

          <div className="home__hero-image">
            <img src={heroImage} alt="CareerRise partners supporting Atlanta workforce" />
          </div>
        </div>
      </section>

      <section className="home__donation">
        <button 
          className="home__donation-link"
          onClick={() => setIsPaymentModalOpen(true)}
        >
          <strong>Click here to make a donation to CareerRise and empower economic mobility in the Atlanta region!</strong>
        </button>
      </section>

      <section className="home__values">
        {VALUE_PROPS.map(({ title, copy }) => (
          <article key={title} className="home__card">
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="home__stats">
        {STATS.map(({ label, value, hint }) => (
          <div key={label} className="home__stat">
            <span className="home__stat-value">{value}</span>
            <span className="home__stat-label">{label}</span>
            <p>{hint}</p>
          </div>
        ))}
      </section>

      <section className="home__steps">
        <div className="home__steps-header">
          <h2>How the Mobility Intelligence Hub Works</h2>
          <p>
            Built for CareerRise to translate complex, distributed data into actionable insight—helping identify the
            right neighborhoods, partners, and investments to accelerate economic mobility.
          </p>
        </div>
        <div className="home__steps-grid">
          {STEPS.map(({ title, copy }) => (
            <article key={title} className="home__step-card">
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home__stakeholders">
        <h2>Unlock Value for Every Stakeholder</h2>
        <div className="home__stakeholder-grid">
          {STAKEHOLDERS.map(({ title, copy }) => (
            <article key={title} className="home__stakeholder-card">
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home__cta-strip">
        <h2>Ready to power the next CareerRise story?</h2>
        <div className="home__cta-links">
          {CTA_LINKS.map(({ to, label }) => (
            <Link key={label} to={to} className="home__cta-link">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

