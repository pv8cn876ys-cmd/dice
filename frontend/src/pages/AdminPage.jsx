import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DICE_FACES = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

export default function AdminPage() {
  const { user, userData, logout, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [targetTelegramId, setTargetTelegramId] = useState('');
  const [outcome, setOutcome] = useState(3);
  const [loading, setLoading] = useState(false);
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phone, setPhone] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [groups, setGroups] = useState([]);
  const [fetchingGroups, setFetchingGroups] = useState(false);

  useEffect(() => {
    if (userData?.botConfig) {
      setApiId(userData.botConfig.apiId || '');
      setApiHash(userData.botConfig.apiHash || '');
      setPhone(userData.botConfig.phone || '');
      setGroupLink(userData.botConfig.groupLink || '');
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const saveBotConfig = async () => {
    if (!apiId.trim() || !apiHash.trim() || !phone.trim() || !groupLink.trim()) {
      return toast.error('Fill all bot configuration fields');
    }

    if (!/^[0-9]+$/.test(apiId.trim())) {
      return toast.error('API ID must be numeric');
    }

    setSavingConfig(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        botConfig: {
          apiId: apiId.trim(),
          apiHash: apiHash.trim(),
          phone: phone.trim(),
          groupLink: groupLink.trim(),
        },
      });
      await refreshUserData();
      toast.success('✅ Telegram bot settings saved');
    } catch (err) {
      console.error('Save bot config error:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchTelegramGroups = async () => {
    if (!userData?.telegramVerified || !userData?.botConfig) {
      return toast.error('Verify Telegram and save bot config first');
    }

    setFetchingGroups(true);
    try {
      // Call Firebase function to get groups
      const response = await fetch(`https://us-central1-dice-3fa71.cloudfunctions.net/telegramBot/getGroups/${user.uid}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setGroups(data.groups || []);
      toast.success('✅ Groups fetched successfully');
    } catch (err) {
      console.error('Fetch groups error:', err);
      toast.error('Failed to fetch groups: ' + err.message);
    } finally {
      setFetchingGroups(false);
    }
  };

  const connectToGroup = async (groupId) => {
    // Placeholder: Implement connection logic
    toast.info(`Connecting to group ${groupId} (placeholder)`);
  };

  const setDiceOutcome = async () => {
    if (!targetTelegramId.trim()) return toast.error('Enter Telegram User ID');
    if (!/^\d{5,20}$/.test(targetTelegramId.trim())) return toast.error('Invalid Telegram User ID');

    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('telegramId', '==', targetTelegramId.trim()));
      const snapshot = await getDocs(q);

      let uid;
      if (!snapshot.empty) {
        uid = snapshot.docs[0].id;
      } else {
        uid = targetTelegramId.trim();
      }

      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        forcedOutcome: outcome,
        telegramId: targetTelegramId.trim(),
      }, { merge: true });

      toast.success(`✅ Next /roll for Telegram ID ${targetTelegramId} will be ${outcome} ${DICE_FACES[outcome]}`);
      setTargetTelegramId('');
      setOutcome(3);
    } catch (err) {
      console.error('Dice outcome error:', err);
      toast.error(err.message || 'Failed to set outcome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 900, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎲</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Dice Control Panel</h1>
          <p style={{ color: 'var(--muted)' }}>Login, verify Telegram, and set dice outcomes from one dashboard.</p>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem', padding: '1.25rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Signed in as</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{userData?.username || user.email}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{userData?.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>Telegram Verified</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: userData?.telegramVerified ? '#4ade80' : '#f59e0b' }}>
                  {userData?.telegramVerified ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {!userData?.telegramVerified && (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/verify-telegram')}>
                🔐 Verify Telegram ID
              </button>
            )}
          </div>

          {userData?.telegramVerified && (
            <div style={{ display: 'grid', gap: '1rem', padding: '1.25rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Telegram Groups</h2>
              <button className="btn btn-primary" onClick={fetchTelegramGroups} disabled={fetchingGroups}>
                {fetchingGroups ? '⏳ Fetching...' : '📱 Fetch My Groups'}
              </button>
              {groups.length > 0 && (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {groups.map(group => (
                    <div key={group.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{group.title}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{group.username} • {group.memberCount} members</div>
                      </div>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => connectToGroup(group.id)}>
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem', padding: '1.25rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Telegram Bot Settings</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API ID</label>
              <input className="input" value={apiId} onChange={e => setApiId(e.target.value)} placeholder="Enter API ID" />

              <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API HASH</label>
              <input className="input" value={apiHash} onChange={e => setApiHash(e.target.value)} placeholder="Enter API hash" />

              <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>PHONE</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter Telegram phone" />

              <label style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>GROUP LINK</label>
              <input className="input" value={groupLink} onChange={e => setGroupLink(e.target.value)} placeholder="Enter group invite link" />

              <button type="button" className="btn btn-primary btn-lg" onClick={saveBotConfig} disabled={savingConfig}>
                {savingConfig ? '⏳ Saving...' : '💾 Save Bot Settings'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem', padding: '1.25rem', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '0.6rem', fontWeight: 600 }}>
                TELEGRAM USER ID
              </label>
              <input 
                className="input" 
                type="number"
                placeholder="e.g. 609161014" 
                value={targetTelegramId} 
                onChange={e => setTargetTelegramId(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                Get ID from @userinfobot in Telegram
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '0.8rem', fontWeight: 600 }}>
                CHOOSE OUTCOME ({outcome} {DICE_FACES[outcome]})
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setOutcome(n)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      border: outcome === n ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                      background: outcome === n ? 'rgba(124,111,255,0.2)' : 'rgba(255,255,255,0.05)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {DICE_FACES[n]}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button"
              className="btn btn-primary btn-lg" 
              onClick={setDiceOutcome}
              disabled={loading}
            >
              {loading ? '⏳ Setting...' : `🎲 Set Next Roll = ${outcome}`}
            </button>

            <div style={{ 
              background: 'rgba(74,222,128,0.08)', 
              border: '1px solid rgba(74,222,128,0.2)', 
              borderRadius: '10px', 
              padding: '1rem', 
              fontSize: '0.85rem', 
              color: 'var(--muted)',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: 'var(--success)' }}>ℹ️ How it works:</strong><br/>
              1. Enter the Telegram User ID<br/>
              2. Choose the dice outcome (1-6)<br/>
              3. When they /roll in group, they get that number<br/>
              4. After one roll, outcome resets automatically
            </div>
          </div>

          <button 
            type="button"
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
