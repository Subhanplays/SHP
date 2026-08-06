import useSettingsStore from '../store/settingsStore';

// Global background rendered behind all pages (solid / gradient / image / video)
const BackgroundLayer = () => {
  const background = useSettingsStore((s) => s.background);
  const b = background || {};

  let backgroundStyle = {};
  if (b.type === 'gradient' && b.gradient) {
    backgroundStyle = { background: b.gradient };
  } else if (b.type === 'image' && b.image) {
    backgroundStyle = { background: `url(${b.image}) center/cover no-repeat fixed` };
  } else {
    backgroundStyle = { background: b.color || '#0f0f1a' };
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -2, background: 'var(--bg-primary)' }}>
      <div style={{ position: 'absolute', inset: 0, ...backgroundStyle }}>
        {b.type === 'video' && b.video && (
          <video
            src={b.video}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: b.blur ? `blur(${b.blur}px)` : 'none' }}
          />
        )}
        {b.type === 'image' && b.image && b.blur > 0 && (
          <div style={{ position: 'absolute', inset: 0, backdropFilter: `blur(${b.blur}px)` }} />
        )}
      </div>
      {(b.overlay > 0) && (
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${b.overlay})` }} />
      )}
    </div>
  );
};

export default BackgroundLayer;
