import React from 'react';

export default function Toast() {
  const [msg, setMsg] = React.useState('');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onShow(e) {
      const text = (e && e.detail) || 'Done';
      setMsg(String(text));
      setOpen(true);
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => setOpen(false), 1500);
    }
    window.addEventListener('toast:show', onShow);
    return () => window.removeEventListener('toast:show', onShow);
  }, []);

  if (!open) return null;

  return (
    <div style={{
      position:'fixed', bottom:16, left:'50%', transform:'translateX(-50%)',
      background:'rgba(0,0,0,0.85)', color:'#fff', padding:'10px 14px', borderRadius:10,
      border:'1px solid rgba(255,255,255,0.2)', zIndex: 4000, pointerEvents:'none',
      boxShadow:'0 6px 20px rgba(0,0,0,0.4)'
    }}>
      {msg}
    </div>
  );
}

