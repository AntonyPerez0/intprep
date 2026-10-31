// PLACEHOLDER — replaced by the full marketing landing page.
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui';

export function Landing() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }} className="stack-lg">
      <Logo />
      <h1 className="display">Master the coding interview, one pattern at a time.</h1>
      <p className="lead">Learn the 150 classic interview problems step by step, then make the patterns stick with daily spaced-repetition drills.</p>
      <div className="row">
        <Link to="/onboarding" className="btn btn-primary btn-lg">
          Get started
        </Link>
      </div>
    </div>
  );
}
