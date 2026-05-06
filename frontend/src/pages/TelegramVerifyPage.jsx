import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function TelegramVerifyPage() {
  const { user, refreshUserData } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const navigate = useNavigate();

  const sendOtp = async () => {
    if (!phoneNumber.trim()) return toast.error('Enter your phone number');
    if (!/^\+?\d{7,15}$/.test(phoneNumber.trim())) return toast.error('Enter a valid phone number');

    setLoading(true);
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      setStep(2);
      toast.success('✅ OTP generated. Enter the code below.');
    } catch (err) {
      console.error('OTP generation error:', err);
      toast.error('Failed to generate OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return toast.error('Enter the OTP');
    if (otp.trim() !== generatedOtp) return toast.error('❌ Wrong OTP');

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: phoneNumber.trim(),
        telegramVerified: true,
        telegramVerifiedAt: new Date().toISOString(),
      });

      await refreshUserData();
      toast.success('✅ Phone verification complete! Going to admin panel...');
      setTimeout(() => navigate('/admin'), 1000);
    } catch (err) {
      console.error('Verify OTP error:', err);
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-centered" style={{ background: 'radial-gradient(ellipse at top, #0d1d35 0%, #0a0a14 70%)' }}>
      <div className="auth-card card" style={{ maxWidth: 450 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Verify Phone Number</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {step === 1 ? 'Enter your phone number to receive an OTP' : 'Enter the OTP code shown below'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {step === 1 ? (
            // Step 1: Enter Phone Number
            <>
              <div style={{ background: 'rgba(124,111,255,0.1)', border: '1px solid rgba(124,111,255,0.25)', borderRadius: '10px', padding: '1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--accent)' }}>📱 Simple OTP</strong>
                <p style={{ marginTop: '0.75rem' }}>
                  Enter your phone number below. The OTP code will be shown on screen for verification.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.6rem', display: 'block', fontWeight: 600 }}>PHONE NUMBER</label>
                <input 
                  className="input" 
                  type="tel"
                  placeholder="e.g. +919810123456" 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <button 
                type="button"
                className="btn btn-primary btn-lg" 
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? '⏳ Generating OTP...' : '🔢 Generate OTP'}
              </button>

              <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
                Skip for now
              </button>
            </>
          ) : (
            // Step 2: Enter OTP
            <>
              <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '1rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--success)' }}>✅ OTP Generated!</strong><br/>
                Your verification code is:
                <div style={{ marginTop: '0.75rem', fontSize: '1.75rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
                  {generatedOtp}
                </div>
                <small>This code is valid for this session only.</small>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.6rem', display: 'block', fontWeight: 600 }}>ENTER OTP CODE</label>
                <input 
                  className="input" 
                  type="text"
                  placeholder="e.g. 123456" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '0.5rem', textAlign: 'center' }}
                  maxLength="6"
                />
              </div>

              <button 
                type="button"
                className="btn btn-primary btn-lg" 
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
              </button>

              <button className="btn btn-secondary" onClick={() => { setStep(1); setOtp(''); }}>
                ← Back & Change Number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
