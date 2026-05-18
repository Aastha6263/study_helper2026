import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';

const DEFAULTS = {
  fname: 'Aman',
  lname: 'Kumar',
  email: 'aman.kumar@example.com',
  username: 'amankumar',
  phone: '+91 98765 43210',
  timezone: 'IST',
  bio: 'Building things on the web.',
  theme: 'light',
  language: 'hi',
  dateFormat: 'DD/MM/YYYY',
  reduceMotion: false,
  highContrast: false,
  compact: false,
  n_product: true,
  n_security: true,
  n_digest: false,
  n_marketing: false,
  n_browser: true,
  n_mobile: true,
  quietFrom: '22:00',
  quietTo: '08:00',
  mfa: true,
  sms: false,
  analytics: true,
  ads: false,
  avatarUrl: '',
};

const TABS = [
  { id: 'profile', icon: '👤', label: 'Profile' },
  { id: 'appearance', icon: '🎨', label: 'Appearance' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'security', icon: '🔒', label: 'Security' },
  { id: 'billing', icon: '💳', label: 'Billing' },
  { id: 'advanced', icon: '⚠️', label: 'Advanced' },
];

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        flexShrink: 0,
        cursor: 'pointer',
        background: checked ? '#1D9E75' : '#ccc',
        position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          top: 3,
          left: checked ? 21 : 3,
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}

function Toast({ message }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1a1a1a',
        color: '#fff',
        padding: '10px 22px',
        borderRadius: 10,
        fontSize: 14,
        zIndex: 999,
        pointerEvents: 'none',
        opacity: message ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    >
      {message}
    </div>
  );
}

function PwStrength({ value }) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const colors = ['#E24B4A', '#BA7517', '#1D9E75', '#0F6E56'];
  const labels = ['Weak', 'Fair', 'Strong', 'Very strong'];
  if (!value) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 2,
            width: `${score * 25}%`,
            background: colors[score - 1] || colors[0],
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          marginTop: 4,
          color: colors[score - 1] || colors[0],
        }}
      >
        {labels[score - 1] || 'Too short'}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user } = useAuth();
  const [s, setS] = useState(DEFAULTS);
  const [toast, setToast] = useState('');
  const [saved, setSaved] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: 1,
      icon: '💻',
      name: 'Chrome on Windows',
      meta: 'Indore, IN · Active now',
      current: true,
    },
    {
      id: 2,
      icon: '📱',
      name: 'Safari on iPhone',
      meta: 'Mumbai, IN · 2 days ago',
      current: false,
    },
    {
      id: 3,
      icon: '💻',
      name: 'Firefox on Mac',
      meta: 'Delhi, IN · 5 days ago',
      current: false,
    },
  ]);
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const fileRef = useRef();
  const toastTimer = useRef();

  useEffect(() => {
    const saved = localStorage.getItem('pro_settings');
    let parsed = null;

    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (error) {
        parsed = null;
      }
    }

    const authDefaults = user
      ? {
          fname: user.name?.split(' ')[0] || DEFAULTS.fname,
          lname: user.name?.split(' ').slice(1).join(' ') || DEFAULTS.lname,
          email: user.email || DEFAULTS.email,
          username:
            user.username || user.email?.split('@')[0] || DEFAULTS.username,
          avatarUrl: user.avatarUrl || DEFAULTS.avatarUrl,
          bio: user.bio || DEFAULTS.bio,
        }
      : {};

    if (parsed) {
      setS({ ...DEFAULTS, ...authDefaults, ...parsed });
    } else if (user) {
      setS({ ...DEFAULTS, ...authDefaults });
    }
  }, [user]);

  const set = (key, val) => setS((prev) => ({ ...prev, [key]: val }));

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const saveAll = () => {
    localStorage.setItem('pro_settings', JSON.stringify(s));
    setSaved(true);
    showToast('Settings saved successfully ✓');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('avatarUrl', ev.target.result);
    reader.readAsDataURL(file);
  };

  const revokeSession = (id) =>
    setSessions((prev) => prev.filter((s) => s.id !== id));

  const handlePwSave = () => {
    if (!pw.current) return showToast('Enter your current password');
    if (pw.new.length < 8)
      return showToast('New password must be at least 8 characters');
    if (pw.new !== pw.confirm) return showToast('Passwords do not match');
    setPw({ current: '', new: '', confirm: '' });
    showToast('Password updated successfully ✓');
  };

  const inp = (overrides = {}) => ({
    style: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      fontSize: 14,
      fontFamily: 'inherit',
      outline: 'none',
      boxSizing: 'border-box',
      background: '#fff',
      color: '#111',
      ...overrides,
    },
  });

  const label = (text) => (
    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 5 }}>
      {text}
    </div>
  );

  const field = (lbl, children, extra = {}) => (
    <div style={{ marginBottom: 14, ...extra }}>
      {label(lbl)}
      {children}
    </div>
  );

  const sectionTitle = (text, mt = 0) => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#9ca3af',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: mt,
      }}
    >
      {text}
    </div>
  );

  const toggleRow = (lbl, sub, key) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: '#111' }}>{lbl}</div>
        {sub && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      <Toggle checked={s[key]} onChange={() => set(key, !s[key])} />
    </div>
  );

  const initials =
    `${s.fname?.[0] || ''}${s.lname?.[0] || ''}`.toUpperCase() || '?';

  /* ─── PANELS ─── */

  const ProfilePanel = (
    <div>
      {/* Avatar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          paddingBottom: 20,
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 600,
            color: '#1d4ed8',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {s.avatarUrl ? (
            <img
              src={s.avatarUrl}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="file"
            ref={fileRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatar}
          />
          <button
            onClick={() => fileRef.current.click()}
            style={{
              fontSize: 13,
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Upload photo
          </button>
          {s.avatarUrl && (
            <button
              onClick={() => set('avatarUrl', '')}
              style={{
                fontSize: 13,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #fca5a5',
                background: '#fff',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {sectionTitle('Personal info')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field(
          'First name',
          <input
            {...inp()}
            value={s.fname}
            onChange={(e) => set('fname', e.target.value)}
          />,
        )}
        {field(
          'Last name',
          <input
            {...inp()}
            value={s.lname}
            onChange={(e) => set('lname', e.target.value)}
          />,
        )}
      </div>
      {field(
        'Email address',
        <input
          {...inp()}
          type="email"
          value={s.email}
          onChange={(e) => set('email', e.target.value)}
        />,
      )}
      {field(
        'Username',
        <input
          {...inp()}
          value={s.username}
          onChange={(e) => set('username', e.target.value)}
        />,
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field(
          'Phone number',
          <input
            {...inp()}
            type="tel"
            value={s.phone}
            onChange={(e) => set('phone', e.target.value)}
          />,
        )}
        {field(
          'Timezone',
          <select
            {...inp()}
            value={s.timezone}
            onChange={(e) => set('timezone', e.target.value)}
          >
            {['IST', 'UTC', 'EST', 'PST', 'CET'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>,
        )}
      </div>
      {field(
        'Bio',
        <textarea
          {...inp()}
          value={s.bio}
          onChange={(e) => set('bio', e.target.value)}
          style={{
            ...inp().style,
            resize: 'vertical',
            minHeight: 72,
            lineHeight: 1.5,
          }}
        />,
      )}
    </div>
  );

  const AppearancePanel = (
    <div>
      {sectionTitle('Theme')}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {[
          { val: 'light', label: 'Light', bg: '#fff' },
          { val: 'dark', label: 'Dark', bg: '#1a1a1a' },
          {
            val: 'system',
            label: 'System',
            bg: 'linear-gradient(to right, #fff 50%, #1a1a1a 50%)',
          },
        ].map((opt) => (
          <div
            key={opt.val}
            onClick={() => set('theme', opt.val)}
            style={{
              border: `${s.theme === opt.val ? 2 : 1}px solid ${s.theme === opt.val ? '#111' : '#e5e7eb'}`,
              borderRadius: 8,
              padding: '10px 8px',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: 13,
              color: s.theme === opt.val ? '#111' : '#6b7280',
              fontWeight: s.theme === opt.val ? 600 : 400,
            }}
          >
            <div
              style={{
                width: 32,
                height: 20,
                borderRadius: 4,
                margin: '0 auto 6px',
                border: '1px solid #e5e7eb',
                background: opt.bg,
              }}
            />
            {opt.label}
          </div>
        ))}
      </div>

      {sectionTitle('Language & region')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field(
          'Language',
          <select
            {...inp()}
            value={s.language}
            onChange={(e) => set('language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="mr">Marathi</option>
            <option value="ta">Tamil</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>,
        )}
        {field(
          'Date format',
          <select
            {...inp()}
            value={s.dateFormat}
            onChange={(e) => set('dateFormat', e.target.value)}
          >
            {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>,
        )}
      </div>

      {sectionTitle('Accessibility', 8)}
      {toggleRow(
        'Reduce motion',
        'Minimize animations across the UI',
        'reduceMotion',
      )}
      {toggleRow(
        'High contrast mode',
        'Increase contrast for better readability',
        'highContrast',
      )}
      {toggleRow(
        'Compact layout',
        'Show more content with less spacing',
        'compact',
      )}
    </div>
  );

  const NotificationsPanel = (
    <div>
      {sectionTitle('Email notifications')}
      {toggleRow(
        'Product updates',
        'New features, improvements, and releases',
        'n_product',
      )}
      {toggleRow(
        'Security alerts',
        'Login from new device, password changes',
        'n_security',
      )}
      {toggleRow(
        'Weekly digest',
        'Summary of your activity each week',
        'n_digest',
      )}
      {toggleRow(
        'Marketing emails',
        'Tips, offers, and promotions',
        'n_marketing',
      )}

      {sectionTitle('Push notifications', 20)}
      {toggleRow(
        'Browser notifications',
        'Show desktop alerts when tab is inactive',
        'n_browser',
      )}
      {toggleRow('Mobile push', 'Notify on your phone app', 'n_mobile')}

      {sectionTitle('Quiet hours', 20)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field(
          'From',
          <input
            {...inp()}
            type="time"
            value={s.quietFrom}
            onChange={(e) => set('quietFrom', e.target.value)}
          />,
        )}
        {field(
          'Until',
          <input
            {...inp()}
            type="time"
            value={s.quietTo}
            onChange={(e) => set('quietTo', e.target.value)}
          />,
        )}
      </div>
    </div>
  );

  const SecurityPanel = (
    <div>
      {sectionTitle('Change password')}
      {field(
        'Current password',
        <input
          {...inp()}
          type="password"
          value={pw.current}
          placeholder="••••••••"
          onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
        />,
      )}
      {field(
        'New password',
        <>
          <input
            {...inp()}
            type="password"
            value={pw.new}
            placeholder="Min 8 characters"
            onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))}
          />
          <PwStrength value={pw.new} />
        </>,
      )}
      {field(
        'Confirm new password',
        <input
          {...inp()}
          type="password"
          value={pw.confirm}
          placeholder="Re-enter new password"
          onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
        />,
      )}
      <button
        onClick={handlePwSave}
        style={{
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          background: '#111',
          color: '#fff',
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        Update password
      </button>

      {sectionTitle('Two-factor authentication')}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Authenticator app
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              Recommended
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            Use Google Authenticator or similar
          </div>
        </div>
        <Toggle checked={s.mfa} onChange={() => set('mfa', !s.mfa)} />
      </div>
      {toggleRow('SMS verification', 'Receive codes via text message', 'sms')}

      {sectionTitle('Active sessions', 20)}
      {sessions.map((sess) => (
        <div
          key={sess.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            border: '1px solid #f3f4f6',
            borderRadius: 8,
            background: '#f9fafb',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{sess.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {sess.name}
                {sess.current && (
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: 11,
                      padding: '1px 7px',
                      borderRadius: 20,
                      fontWeight: 600,
                    }}
                  >
                    Current
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {sess.meta}
              </div>
            </div>
          </div>
          {!sess.current && (
            <button
              onClick={() => {
                revokeSession(sess.id);
                showToast('Session revoked');
              }}
              style={{
                fontSize: 12,
                padding: '4px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              Revoke
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const BillingPanel = (
    <div>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
            Free plan
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            Renews automatically · ₹0/month
          </div>
        </div>
        <button
          onClick={() => showToast('Redirecting to upgrade page...')}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#111',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Upgrade to Pro
        </button>
      </div>

      {sectionTitle('Usage this month')}
      {[
        {
          label: 'API calls',
          used: 4200,
          total: 10000,
          unit: '',
          color: '#1D9E75',
        },
        {
          label: 'Storage',
          used: 2.1,
          total: 5,
          unit: ' GB',
          color: '#378ADD',
        },
        { label: 'Seats', used: 1, total: 1, unit: '', color: '#BA7517' },
      ].map((u) => (
        <div key={u.label} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#6b7280',
              marginBottom: 5,
            }}
          >
            <span>{u.label}</span>
            <span>
              {u.used}
              {u.unit} / {u.total}
              {u.unit}
            </span>
          </div>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3 }}>
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                background: u.color,
                width: `${Math.min(100, (u.used / u.total) * 100)}%`,
                transition: 'width 0.4s',
              }}
            />
          </div>
        </div>
      ))}

      {sectionTitle('Invoices', 8)}
      <div
        style={{
          fontSize: 13,
          color: '#9ca3af',
          padding: 16,
          textAlign: 'center',
          border: '1px solid #f3f4f6',
          borderRadius: 8,
        }}
      >
        No invoices yet. Upgrade to a paid plan to see billing history.
      </div>
    </div>
  );

  const AdvancedPanel = (
    <div>
      {sectionTitle('Data & privacy')}
      {toggleRow(
        'Usage analytics',
        'Help improve the product with anonymous data',
        'analytics',
      )}
      {toggleRow('Personalized ads', 'Allow ads based on your activity', 'ads')}

      <button
        onClick={() =>
          showToast("Data export requested. You'll receive an email shortly.")
        }
        style={{
          marginTop: 16,
          fontSize: 13,
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        Export my data
      </button>

      <div
        style={{
          border: '1px solid #fca5a5',
          borderRadius: 10,
          padding: '14px 16px',
          marginTop: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#ef4444',
            marginBottom: 12,
          }}
        >
          Danger zone
        </div>
        {[
          {
            label: 'Sign out of all devices',
            sub: 'Revoke all active sessions immediately',
            action: 'Sign out all',
            msg: 'Signed out of all other devices.',
          },
          {
            label: 'Deactivate account',
            sub: 'Temporarily disable your account',
            action: 'Deactivate',
            msg: 'Account deactivation request sent.',
          },
          {
            label: 'Delete account',
            sub: 'Permanently delete all data. Cannot be undone.',
            action: 'Delete account',
            msg: 'Contact support to confirm account deletion.',
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid #fef2f2',
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: '#111' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {item.sub}
              </div>
            </div>
            <button
              onClick={() => showToast(item.msg)}
              style={{
                fontSize: 12,
                padding: '5px 12px',
                borderRadius: 8,
                border: '1px solid #fca5a5',
                background: '#fff',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const panels = {
    profile: ProfilePanel,
    appearance: AppearancePanel,
    notifications: NotificationsPanel,
    security: SecurityPanel,
    billing: BillingPanel,
    advanced: AdvancedPanel,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          maxWidth: 860,
          margin: '0 auto 24px',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>
          Settings
        </h1>
        <button
          onClick={saveAll}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: saved ? '#15803d' : '#111',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'background 0.3s',
          }}
        >
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 16,
          maxWidth: 860,
          margin: '0 auto',
        }}
      >
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border:
                  activeTab === tab.id
                    ? '1px solid #e5e7eb'
                    : '1px solid transparent',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#111' : '#6b7280',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            padding: 24,
          }}
        >
          {panels[activeTab]}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
