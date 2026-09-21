import "./App.css";

function App() {
  const categories = [
    { icon: "🏠", name: "Housing" },
    { icon: "🏨", name: "Hostels" },
    { icon: "🔧", name: "Services" },
    { icon: "🛒", name: "Shopping" },
    { icon: "💼", name: "Jobs" },
    { icon: "🚗", name: "Transport" },
    { icon: "🏥", name: "Health" },
    { icon: "🎓", name: "Education" },
    { icon: "🍔", name: "Food" },
    { icon: "📦", name: "Delivery" },
    { icon: "🏪", name: "Businesses" },
    { icon: "📅", name: "Events" },
  ];

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          <span>MTAA</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#businesses">Businesses</a>
          <a href="#about">About</a>
        </nav>

        <div className="auth-buttons">
          <button className="login">Login</button>
          <button className="signup">Sign Up</button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="badge">
              🌍 Everything you need, in one place
            </div>

            <h1>
              Solve your problem.
              <br />
              <span>Find what you need.</span>
            </h1>

            <p>
              Find people, businesses, products and services around you.
              Whatever you need, MTAA helps you find it.
            </p>

            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="What do you need help with?"
              />
              <button>Search</button>
            </div>

            <div className="quick-search">
              <span>Popular:</span>
              <button>House</button>
              <button>Jobs</button>
              <button>Fundi</button>
              <button>Food</button>
              <button>Delivery</button>
            </div>
          </div>
        </section>

        <section className="categories" id="services">
          <div className="section-heading">
            <span>EXPLORE MTAA</span>
            <h2>What do you need today?</h2>
            <p>
              Choose a category or simply search for your problem.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <div className="category-card" key={category.name}>
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>Explore →</p>
              </div>
            ))}
          </div>
        </section>

        <section className="problem-section">
          <div>
            <span className="section-label">HAVE A PROBLEM?</span>
            <h2>
              Just tell MTAA
              <br />
              what you need.
            </h2>
            <p>
              You don't have to know which category to choose.
              Describe your problem and we'll help you find the
              right solution.
            </p>

            <button className="problem-button">
              🤖 Ask MTAA
            </button>
          </div>

          <div className="assistant-card">
            <div className="assistant-header">
              <div className="assistant-icon">🤖</div>
              <div>
                <strong>MTAA Assistant</strong>
                <small>Online</small>
              </div>
            </div>

            <div className="message user-message">
              I need a plumber near me today.
            </div>

            <div className="message bot-message">
              👋 I can help you find available plumbers near you.
            </div>

            <div className="assistant-input">
              <span>Describe your problem...</span>
              <button>➤</button>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-logo">MTAA</div>
        <p>One platform. Many solutions.</p>
        <p>© 2026 MTAA. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;