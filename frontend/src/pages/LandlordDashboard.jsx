import { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Users, CheckCircle, Check, X, Bell, Building } from 'lucide-react';

const LandlordDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newPropName, setNewPropName] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropLocality, setNewPropLocality] = useState('');
  const [newPropRent, setNewPropRent] = useState('');
  const [newPropSafetyDeposit, setNewPropSafetyDeposit] = useState('');
  const [newPropCategory, setNewPropCategory] = useState('');

  // Room management states
  const [roomNumbers, setRoomNumbers] = useState({});
  const [roomCapacities, setRoomCapacities] = useState({});
  const [selectedRooms, setSelectedRooms] = useState({});

  useEffect(() => {
    fetchProperties();
    fetchComplaints();
    fetchNotifications();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await axios.get('/api/properties', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProperties(res.data);
    } catch (error) {
      console.error(error);
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

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/properties', {
        name: newPropName, address: newPropAddress, locality: newPropLocality, baseRent: newPropRent, safetyDeposit: newPropSafetyDeposit, category: newPropCategory
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewPropName(''); setNewPropAddress(''); setNewPropLocality(''); setNewPropRent(''); setNewPropSafetyDeposit(''); setNewPropCategory('');
      fetchProperties();
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveTenant = async (propertyId, tenantId) => {
    const roomId = selectedRooms[tenantId];
    if (!roomId) return alert('Please select a room for this tenant');
    try {
      await axios.put(`/api/properties/${propertyId}/tenants/${tenantId}/approve`, { roomId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProperties();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error approving tenant');
    }
  };

  const handleAddRoom = async (propertyId) => {
    const roomNumber = roomNumbers[propertyId];
    const capacity = roomCapacities[propertyId];
    if (!roomNumber) return alert('Please enter a room number');
    try {
      await axios.post(`/api/properties/${propertyId}/rooms`, { roomNumber, capacity: capacity || 1 }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRoomNumbers({ ...roomNumbers, [propertyId]: '' });
      setRoomCapacities({ ...roomCapacities, [propertyId]: '' });
      fetchProperties();
    } catch (error) {
      console.error(error);
      alert('Error adding room');
    }
  };

  const handleRejectTenant = async (propertyId, tenantId) => {
    try {
      await axios.put(`/api/properties/${propertyId}/tenants/${tenantId}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchProperties();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResolveComplaint = async (id) => {
    const notes = prompt('Enter resolution notes:');
    if (notes === null) return;
    try {
      await axios.put(`/api/complaints/${id}`, { status: 'resolved', resolutionNotes: notes }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchComplaints();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckout = async (propertyId, tenantId) => {
    if (!window.confirm('Are you sure you want to check out this tenant? This will notify them to provide feedback.')) return;
    try {
      await axios.put(`/api/properties/${propertyId}/tenants/${tenantId}/checkout`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Tenant checked out successfully.');
      fetchProperties();
    } catch (error) {
      console.error(error);
      alert('Error checking out tenant.');
    }
  };

  return (
    <div className="container fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        {/* Properties Management */}
        <div className="card glass-panel" style={{ flexGrow: 1 }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Home size={20} className="gradient-text" /> My Properties</h3>
          
          <form onSubmit={handleAddProperty} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
            <input type="text" placeholder="Property Name" className="input-field" value={newPropName} onChange={e => setNewPropName(e.target.value)} required />
            <input type="text" placeholder="Address" className="input-field" value={newPropAddress} onChange={e => setNewPropAddress(e.target.value)} required />
            <input type="text" placeholder="Locality" className="input-field" value={newPropLocality} onChange={e => setNewPropLocality(e.target.value)} required />
            <select className="input-field" value={newPropCategory} onChange={e => setNewPropCategory(e.target.value)} required>
              <option value="" disabled>Select Property Type</option>
              <option value="Apartment (Building)">Apartment (Building)</option>
              <option value="Apartment (Society)">Apartment (Society)</option>
              <option value="Bungalow">Bungalow</option>
              <option value="Villa">Villa</option>
              <option value="PG (Sharing)">PG (Sharing)</option>
              <option value="PG (Solo)">PG (Solo)</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" placeholder="Base Rent (₹)" className="input-field" value={newPropRent} onChange={e => setNewPropRent(e.target.value)} required style={{ flex: 1 }} />
              <input type="number" placeholder="Safety Deposit (₹)" className="input-field" value={newPropSafetyDeposit} onChange={e => setNewPropSafetyDeposit(e.target.value)} style={{ flex: 1 }} />
            </div>
            <button type="submit" className="btn-primary">Add Property</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {properties.map(prop => (
              <div key={prop._id} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '18px' }}>{prop.name}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{prop.address} ({prop.locality})</div>
                    {prop.category && <div style={{ display: 'inline-block', padding: '2px 8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: '12px', fontSize: '12px', marginTop: '4px' }}>{prop.category}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>₹{prop.baseRent}/mo</div>
                    {prop.safetyDeposit > 0 && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dep: ₹{prop.safetyDeposit}</div>}
                  </div>
                </div>

                {/* Rooms Management Section */}
                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building size={16} /> Rooms
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                      type="text" placeholder="Room #" className="input-field" style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                      value={roomNumbers[prop._id] || ''} onChange={e => setRoomNumbers({...roomNumbers, [prop._id]: e.target.value})}
                    />
                    <input 
                      type="number" placeholder="Cap." className="input-field" style={{ width: '60px', padding: '4px 8px', fontSize: '12px' }}
                      value={roomCapacities[prop._id] || ''} onChange={e => setRoomCapacities({...roomCapacities, [prop._id]: e.target.value})}
                    />
                    <button onClick={() => handleAddRoom(prop._id)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>Add</button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {prop.rooms && prop.rooms.map(room => (
                      <div key={room._id} style={{ padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '12px' }}>
                        <strong>{room.roomNumber}</strong>: {room.tenants.length}/{room.capacity}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--accent-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={16} /> Tenants ({prop.tenants.length})
                  </h4>
                  {prop.tenants.length === 0 ? (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No tenants requested or approved yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {prop.tenants.map(tenant => (
                        <div key={tenant._id} style={{ padding: '12px', background: 'var(--glass-bg)', borderRadius: '6px', fontSize: '14px', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{tenant.firstName} {tenant.lastName}</strong>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                              background: tenant.approvalStatus === 'pending' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              color: tenant.approvalStatus === 'pending' ? '#eab308' : '#22c55e'
                            }}>
                              {tenant.approvalStatus.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Email: {tenant.email} • Age: {tenant.age} • Gender: {tenant.gender}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ID Proof: 
                            {tenant.idProof ? (
                              <a href={tenant.idProof} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                                View Document
                              </a>
                            ) : (
                              <span>Not provided</span>
                            )}
                          </div>

                          {tenant.approvalStatus === 'approved' && (
                            <>
                              <div style={{ marginTop: '8px', padding: '6px', borderRadius: '4px', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Rent Due:</span>
                                <strong style={{ color: tenant.rentDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                  {tenant.rentDue > 0 ? `₹${tenant.rentDue}` : 'Paid / Up to date'}
                                </strong>
                              </div>
                              <button 
                                onClick={() => handleCheckout(prop._id, tenant._id)} 
                                className="btn-primary" 
                                style={{ marginTop: '12px', width: '100%', background: 'var(--accent-secondary)' }}
                              >
                                Check Out Tenant
                              </button>
                            </>
                          )}
                          
                          {tenant.approvalStatus === 'pending' && (
                            <div style={{ marginTop: '12px' }}>
                              <select 
                                className="input-field" style={{ marginBottom: '8px', fontSize: '12px' }}
                                value={selectedRooms[tenant._id] || ''}
                                onChange={e => setSelectedRooms({...selectedRooms, [tenant._id]: e.target.value})}
                              >
                                <option value="">Select Room for Approval</option>
                                {prop.rooms && prop.rooms.map(room => (
                                  <option key={room._id} value={room._id} disabled={room.tenants.length >= room.capacity}>
                                    {room.roomNumber} ({room.tenants.length}/{room.capacity} filled)
                                  </option>
                                ))}
                              </select>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleApproveTenant(prop._id, tenant._id)} className="btn-primary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
                                  <Check size={16} /> Approve
                                </button>
                                <button onClick={() => handleRejectTenant(prop._id, tenant._id)} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                  <X size={16} /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints and Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card glass-panel">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} className="gradient-text" /> Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.filter(n => !n.isRead).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No new notifications.</p>
              ) : (
                notifications.filter(n => !n.isRead).map(notification => (
                  <div key={notification._id} style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--accent-primary)', borderRadius: '4px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ margin: 0 }}>{notification.message}</p>
                      <button onClick={() => handleMarkNotificationRead(notification._id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Check size={16}/></button>
                    </div>
                    <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>{new Date(notification.createdAt).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card glass-panel" style={{ flexGrow: 1 }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} className="gradient-text" /> Tenant Complaints</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaints.filter(c => c.status !== 'resolved').length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No pending complaints.</p>
              ) : (
                complaints.filter(c => c.status !== 'resolved').map(complaint => (
                  <div key={complaint._id} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '16px' }}>{complaint.title}</h4>
                      <button onClick={() => handleResolveComplaint(complaint._id)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>Resolve</button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '8px 0' }}>{complaint.description}</p>
                    <div style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>From: {complaint.tenant?.firstName} {complaint.tenant?.lastName} ({complaint.property?.name})</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordDashboard;
