'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>A system error occurred. Please try again.</p>
        <button
          onClick={reset}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#FF9900',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
