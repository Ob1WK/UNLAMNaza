export default function LitePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
        UNLaM EF Tracker
      </h1>
      <p style={{ marginBottom: '12px' }}>
        Si ves esta pantalla en iPhone, el deploy funciona y el problema está en
        el bundle principal.
      </p>
      <p>Volvé a la home cuando te lo indiquemos.</p>
    </main>
  );
}
