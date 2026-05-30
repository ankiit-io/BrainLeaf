import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Upload PDF",
    description: "Add your book file",
  },
  {
    number: "2",
    title: "AI Processing",
    description: "We analyze the content",
  },
  {
    number: "3",
    title: "Voice Chat",
    description: "Discuss with AI",
  },
];

const HeroSection = () => {
  return (
    <section className="wrapper pt-28 mb-10 md:mb-16">
      <div className="library-hero-card">
        <div className="library-hero-content">
          {/* Left Part */}
          <div className="library-hero-text">
            <h1 className="library-hero-title">Your Library</h1>
            <p className="library-hero-description">
              Convert your books into interactive AI conversations. Listen,
              learn, and discuss your favorite reads.
            </p>
            <Link href="/books/new" className="library-hero-button-link">
              <button className="library-hero-button hover:cursor-pointer" type="button">
                <span className="library-hero-button-icon" aria-hidden="true">
                  +
                </span>
                Add new book
              </button>
            </Link>
          </div>

          {/* Center Part - Desktop */}
          <div className="library-hero-illustration-desktop">
            <Image
              src="/assets/hero-illustration.png"
              alt="Vintage books and a globe"
              width={360}
              height={240}
              className="library-hero-illustration-img"
              priority
            />
          </div>

          {/* Center Part - Mobile (Hidden on Desktop) */}
          <div className="library-hero-illustration">
            <Image
              src="/assets/hero-illustration.png"
              alt="Vintage books and a globe"
              width={300}
              height={200}
              className="library-hero-illustration-img"
            />
          </div>

          {/* Right Part */}
          <div className="library-steps-card">
            <ul className="library-steps-list">
              {steps.map((step) => (
                <li className="library-step-item" key={step.number}>
                  <div className="library-step-number">{step.number}</div>
                  <div className="library-step-content">
                    <h3 className="library-step-title">{step.title}</h3>
                    <p className="library-step-description">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
