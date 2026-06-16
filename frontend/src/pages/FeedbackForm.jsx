import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, Send } from 'lucide-react';

const FeedbackForm = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [stayDuration, setStayDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/feedback', {
        propertyId, rating, comment, stayDuration
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Thank you for your feedback!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Error submitting feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '600px', marginTop: '40px' }}>
      <div className="card glass-panel">
        <h2 className="gradient-text" style={{ marginBottom: '24px' }}>Share Your Experience</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Your feedback helps landlords improve their services and helps future tenants make better choices.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: num <= rating ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <Star size={32} fill={num <= rating ? 'var(--accent-primary)' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>How long did you stay?</label>
            <input
              type="text"
              placeholder="e.g. 6 months, 1 year"
              className="input-field"
              value={stayDuration}
              onChange={(e) => setStayDuration(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Comments</label>
            <textarea
              placeholder="Tell us about your stay, the facilities, and the landlord..."
              className="input-field"
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={18} /> {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
