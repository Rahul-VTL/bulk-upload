import React, { useState } from 'react';
import { AutoShimmer } from './ui/AutoShimmer';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending' | 'Suspended';
}

const REAL_USERS: User[] = [
  { id: 'USR-01', name: 'Sophia Martinez', email: 'sophia.m@example.com', role: 'Compliance Lead', status: 'Active' },
  { id: 'USR-02', name: 'David Chen', email: 'david.c@example.com', role: 'Security Analyst', status: 'Active' },
  { id: 'USR-03', name: 'Amara Okafor', email: 'amara.o@example.com', role: 'Operations Officer', status: 'Pending' },
  { id: 'USR-04', name: 'Liam Gallagher', email: 'liam.g@example.com', role: 'Data Architect', status: 'Active' }
];

// Mock data template for Table during loading
const MOCK_TEMPLATE_USERS: User[] = [
  { id: 'MOCK-1', name: 'Loading Placeholder', email: 'placeholder.user@domain.com', role: 'Placeholder Role', status: 'Active' },
  { id: 'MOCK-2', name: 'Loading Placeholder', email: 'placeholder.user@domain.com', role: 'Placeholder Role', status: 'Active' },
  { id: 'MOCK-3', name: 'Loading Placeholder', email: 'placeholder.user@domain.com', role: 'Placeholder Role', status: 'Active' },
  { id: 'MOCK-4', name: 'Loading Placeholder', email: 'placeholder.user@domain.com', role: 'Placeholder Role', status: 'Active' }
];

// --- 1. Dashboard KPI Cards ---
const DashboardCards: React.FC = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
    <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 6 }}>Total Batches</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>128,490</div>
      <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 600 }}>↑ +14.2% from last week</div>
    </div>

    <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 6 }}>Validation Rate</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>99.4%</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Across all file types</div>
    </div>

    <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 6 }}>Avg Processing Time</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>480ms</div>
      <div style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 600 }}>⚡ 3.2x faster streaming</div>
    </div>

    <div style={{ background: '#ffffff', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 6 }}>Active Observers</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>1,842</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Connected live sessions</div>
    </div>
  </div>
);

// --- 2. Dynamic Table ---
const UserTable: React.FC<{ users?: User[] }> = ({ users = [] }) => (
  <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>ID</th>
          <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>User Name</th>
          <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Email</th>
          <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Role</th>
          <th style={{ padding: '12px 18px', fontWeight: 600, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '12px 18px', fontWeight: 600, color: '#64748b', fontSize: 13 }}>{u.id}</td>
            <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0f172a' }}>{u.name}</td>
            <td style={{ padding: '12px 18px', color: '#475569' }}>{u.email}</td>
            <td style={{ padding: '12px 18px', color: '#334155' }}>{u.role}</td>
            <td style={{ padding: '12px 18px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: u.status === 'Active' ? '#ecfdf5' : '#fffbeb',
                  color: u.status === 'Active' ? '#059669' : '#d97706'
                }}
              >
                {u.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- 3. Form Component ---
const ObserverRegistrationForm: React.FC = () => (
  <div style={{ background: '#ffffff', padding: 24, borderRadius: 10, border: '1px solid #e2e8f0' }}>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>
      Create Observer Assignment
    </h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
          Full Name
        </label>
        <input
          type="text"
          defaultValue="Rahul Sharma"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
          readOnly
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
          Assignment Center
        </label>
        <select
          defaultValue="delhi-central"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
          disabled
        >
          <option value="delhi-central">Delhi Central Examination Hall #4</option>
          <option value="mumbai-west">Mumbai West Center #2</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
          Scheduled Exam Date
        </label>
        <input
          type="date"
          defaultValue="2026-10-15"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
          readOnly
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
          Shift Code
        </label>
        <input
          type="text"
          defaultValue="SHIFT-MORNING-01"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
          readOnly
        />
      </div>
    </div>

    <div style={{ marginTop: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
        Special Instructions
      </label>
      <textarea
        defaultValue="Ensure high-speed optical biometric scanner is calibrated prior to reporting time."
        rows={2}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
        readOnly
      />
    </div>

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
      <button
        type="button"
        style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
      >
        Cancel
      </button>
      <button
        type="button"
        style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#ffffff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        Submit Assignment
      </button>
    </div>
  </div>
);

export const AutoShimmerDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [delay, setDelay] = useState<number>(0);
  const [minimumDuration, setMinimumDuration] = useState<number>(0);

  // During loading, users array can be empty, proving templateProps works!
  const users = isLoading ? [] : REAL_USERS;

  const simulateFetch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1600);
  };

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
      {/* Control Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            AutoShimmer System Showcase
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Automatic skeleton generation based on real DOM structure via <code>&lt;AutoShimmer loading=&#123;...&#125;&gt;</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setIsLoading(!isLoading)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: isLoading ? '#ef4444' : '#10b981',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {isLoading ? '🔴 Stop Shimmer (loading = false)' : '🟢 Start Shimmer (loading = true)'}
          </button>

          <button
            type="button"
            onClick={simulateFetch}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            ⚡ Simulate 1.6s API Call
          </button>
        </div>
      </div>

      {/* 1. Dashboard KPI Cards */}
      <div style={{ marginBottom: 28 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
          1. DASHBOARD KPI CARDS
        </h4>
        <AutoShimmer loading={isLoading} delay={delay} minimumDuration={minimumDuration}>
          <DashboardCards />
        </AutoShimmer>
      </div>

      {/* 2. Dynamic Data Table with templateProps */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#475569', margin: 0 }}>
            2. DYNAMIC DATA TABLE (Using <code>templateProps</code> for empty loading state)
          </h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Data during loading: <strong>{isLoading ? '0 records (empty)' : `${users.length} records`}</strong>
          </span>
        </div>

        <AutoShimmer
          loading={isLoading}
          delay={delay}
          minimumDuration={minimumDuration}
          templateProps={{ users: MOCK_TEMPLATE_USERS }}
        >
          <UserTable users={users} />
        </AutoShimmer>
      </div>

      {/* 3. Form Component */}
      <div style={{ marginBottom: 28 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
          3. REGISTRATION & ASSIGNMENT FORM
        </h4>
        <AutoShimmer loading={isLoading} delay={delay} minimumDuration={minimumDuration}>
          <ObserverRegistrationForm />
        </AutoShimmer>
      </div>
    </div>
  );
};
