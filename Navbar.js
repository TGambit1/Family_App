import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div>
        <Link href="/">Home</Link>
        <Link href="/tasks">Tasks</Link>
      </div>
      <div>
        {/* Future links for profile, settings, etc. */}
      </div>
    </nav>
  );
}