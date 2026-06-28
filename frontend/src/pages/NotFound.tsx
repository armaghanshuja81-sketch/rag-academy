import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="clay-text-center" style={{ padding: '4rem 0' }}>
      <div className="clay-stat" style={{ fontSize: '6rem', marginBottom: '1rem' }}>404</div>
      <h1 className="clay-mb-sm">Page Not Found</h1>
      <p className="clay-text-muted clay-mb-lg">The page you are looking for does not exist.</p>
      <div className="clay-flex clay-justify-center clay-gap-md">
        <Link to="/" className="clay-btn clay-btn--primary clay-btn--lg">Back to Home</Link>
        <Link to="/lessons" className="clay-btn clay-btn--lg">Browse Lessons</Link>
      </div>
    </div>
  )
}
