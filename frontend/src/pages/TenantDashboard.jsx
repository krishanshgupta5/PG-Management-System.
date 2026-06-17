import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { AlertCircle, CreditCard, Clock, Search, MapPin, Building, Info, Bell, Check } from 'lucide-react';

const TenantDashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [rentDue, setRentDue] = useState(0);

  // Browsing state
  const [searchLocality, setSearchLocality] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [availableProperties, setAvailableProperties] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Sync rentDue reactively from user so it always reflects the latest value,
  // even when user is set after login (useState initial value only runs once at mount).
  useEffect(() => {
    if (user?.rentDue !== undefined) {
      setRentDue(user.rentDue);
    }
  }, [user?.rentDue]);

  useEffect(() => {
    fetchNotifications();
    if (user?.approvalStatus === 'approved') {
      fetchComplaints();
    } else if (!user?.property || user?.approvalStatus === 'pending') {
      fetchAvailableProperties();
    }
  }, [user]);

  const fetchAvailableProperties = async () => {
    setIsSearching(true);
    try {
      let url = '/api/properties/all';
      const params = [];
      if (searchLocality) params.push(`locality=${searchLocality}`);
      if (searchCategory) params.push(`category=${searchCategory}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAvailableProperties(res.data);
    } catch (error) {
      console.error(error);
    }
    setIsSearching(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAvailableProperties();
  };

  const handleRequestToJoin = async (propertyId) => {
    try {
      await axios.post(`/api/properties/${propertyId}/request`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Request sent successfully! Please wait for landlord approval.');
      window.location.reload(); // Quick way to refresh context
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to send request');
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('/api/complaints', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setComplaints(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/complaints', { title, description }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTitle('');
      setDescription('');
      fetchComplaints();
    } catch (error) {
      console.error(error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsPaying(true);
    try {
      // Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay. Please check your internet connection.');
        setIsPaying(false);
        return;
      }

      // Step 1: Create order on the backend
      const orderRes = await axios.post('/api/payments/create-order',
        { amount: Number(paymentAmount) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const { orderId, amount: orderAmount, currency, paymentId, keyId } = orderRes.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: orderAmount,
        currency,
        name: 'Gram PG',
        description: 'Rent Payment',
        order_id: orderId,
        handler: async (response) => {
          try {
            // Step 3: Verify payment on the backend
            const verifyRes = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRentDue(verifyRes.data.rentDue);
            setPaymentAmount('');
            alert(`Payment Successful! Transaction ID: ${response.razorpay_payment_id}`);
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        alert(`Payment Failed: ${response.error.description}`);
        setIsPaying(false);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setIsPaying(false);
    }
  };


  if (!user) return null;

  // View 1: Rejected
  if (user.approvalStatus === 'rejected') {
    return (
      <div className="container fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
        <div className="card glass-panel" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div style={{ color: 'var(--danger)', marginBottom: '16px' }}><AlertCircle size={48} style={{ margin: '0 auto' }} /></div>
          <h2>Application Rejected</h2>
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{user.rejectionNote}</p>
          <button className="btn-primary" style={{ marginTop: '24px' }} onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Browse Screen Wrapper (shows for pending or none)
  const renderBrowseView = () => (
    <div className="container fade-in">
      {/* Notifications Panel */}
      {notifications.some(n => !n.isRead) && (
        <div className="card glass-panel" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} className="gradient-text" /> Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.filter(n => !n.isRead).map(notification => (
              <div key={notification._id} style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--accent-primary)', borderRadius: '4px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0 }}>
                    {notification.message.includes('here: /') ? (
                      <>
                        {notification.message.split('here: ')[0]}
                        <Link to={notification.message.split('here: ')[1]} style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Click here to share feedback</Link>
                      </>
                    ) : notification.message}
                  </p>
                  <small style={{ color: 'var(--text-secondary)' }}>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
                <button onClick={() => handleMarkNotificationRead(notification._id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Check size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.approvalStatus === 'pending' && (
        <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--warning)', color: 'var(--warning)', padding: '16px', borderRadius: '8px', margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={24} />
          <div>
            <strong>Application Pending:</strong> Your request to join a property has been sent to the landlord. You can still browse other properties while you wait.
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <h2 className="gradient-text" style={{ fontSize: '32px' }}>Find Your Next PG</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Search by locality and property type.</p>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '800px', margin: '24px auto', justifyContent: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <MapPin size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Locality" 
              className="input-field" 
              style={{ paddingLeft: '40px' }}
              value={searchLocality}
              onChange={e => setSearchLocality(e.target.value)}
            />
          </div>
          <select 
            className="input-field" 
            style={{ flex: '1 1 200px' }}
            value={searchCategory}
            onChange={e => setSearchCategory(e.target.value)}
          >
            <option value="">All Property Types</option>
            <option value="Apartment (Building)">Apartment (Building)</option>
            <option value="Apartment (Society)">Apartment (Society)</option>
            <option value="Bungalow">Bungalow</option>
            <option value="Villa">Villa</option>
            <option value="PG (Sharing)">PG (Sharing)</option>
            <option value="PG (Solo)">PG (Solo)</option>
          </select>
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} /> Search
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {isSearching ? (
          <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Loading properties...</p>
        ) : availableProperties.length === 0 ? (
          <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>No properties found.</p>
        ) : (
          availableProperties.map(prop => (
            <div key={prop._id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '20px' }}>{prop.name}</h3>
                  {prop.category && <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginTop: '4px' }}>{prop.category}</div>}
                </div>
                <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '18px' }}>₹{prop.baseRent}/mo</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={16} /> {prop.locality}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{prop.address}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  <Info size={16} color="var(--accent-primary)" />
                  <span>Owner: {prop.owner?.firstName} {prop.owner?.lastName}</span>
                </div>
                <button onClick={() => handleRequestToJoin(prop._id)} className="btn-primary" style={{ width: '100%' }}>
                  Request to Join
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!user.property || user.approvalStatus === 'none' || user.approvalStatus === 'pending') {
    return renderBrowseView();
  }

  // View 4: Approved Dashboard
  return (
    <div className="container fade-in">
      {/* Notifications Panel */}
      {notifications.some(n => !n.isRead) && (
        <div className="card glass-panel" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} className="gradient-text" /> Notifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.filter(n => !n.isRead).map(notification => (
              <div key={notification._id} style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--accent-primary)', borderRadius: '4px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0 }}>{notification.message}</p>
                  <small style={{ color: 'var(--text-secondary)' }}>{new Date(notification.createdAt).toLocaleString()}</small>
                </div>
                <button onClick={() => handleMarkNotificationRead(notification._id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Check size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        {/* Property & Room Card */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-primary)', marginBottom: '16px' }}>
            <Building size={32} />
          </div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Your Residence</h3>
          <h2 style={{ fontSize: '24px' }}>{user.property?.name || 'Loading...'}</h2>
          <div style={{ 
            marginTop: '12px', padding: '8px 16px', background: 'var(--accent-primary)', color: 'white', borderRadius: '20px', fontWeight: 'bold' 
          }}>
            Room: {user.room?.roomNumber || 'N/A'}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '14px' }}>
            <MapPin size={14} /> {user.property?.address}
          </p>
        </div>

        {/* Rent Status Card */}
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-primary)', marginBottom: '16px' }}>
            <CreditCard size={32} />
          </div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Rent Due</h3>
          <h2 style={{ fontSize: '48px', color: rentDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
            ₹{rentDue}
          </h2>
          {rentDue > 0 && <p style={{ color: 'var(--warning)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> Please pay your rent to avoid late fees.</p>}
          
          {rentDue > 0 && (
            <form onSubmit={handlePayment} style={{ width: '100%', marginTop: '24px', display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                placeholder="Amount" 
                className="input-field" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(e.target.value)} 
                required 
                max={rentDue}
              />
              <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={isPaying}>
                {isPaying ? 'Processing Gateway...' : 'Pay Now'}
              </button>
            </form>
          )}
        </div>

        {/* Raise Complaint Form */}
        <div className="card glass-panel">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20} className="gradient-text" /> Raise a Complaint</h3>
          <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Complaint Title" 
              className="input-field" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Description of the issue..." 
              className="input-field" 
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary">Submit Complaint</button>
          </form>
        </div>
      </div>

      {/* Complaints List */}
      <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Your Complaints</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {complaints.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No complaints raised yet.</p>
        ) : (
          complaints.map(complaint => (
            <div key={complaint._id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>{complaint.title}</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>{complaint.description}</p>
                {complaint.resolutionNotes && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                    <strong>Resolution:</strong> {complaint.resolutionNotes}
                  </div>
                )}
              </div>
              <span style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                background: complaint.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: complaint.status === 'resolved' ? 'var(--success)' : 'var(--warning)'
              }}>
                {complaint.status.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
