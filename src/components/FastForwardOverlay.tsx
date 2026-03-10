import { useEffect, useState } from 'react';

type Props = {
  engineReady: boolean;
  onChange: (enabled: boolean) => void;
};

export function FastForwardOverlay({ engineReady, onChange }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    return () => {
      onChange(false);
    };
  }, [onChange]);

  const setEnabled = (enabled: boolean) => {
    setActive(enabled);
    onChange(enabled);
  };

  const stop = () => {
    setEnabled(false);
  };

  return (
    <button
      type="button"
      className={`fast-forward-overlay${active ? ' active' : ''}`}
      aria-label="Fast forward"
      disabled={!engineReady}
      onPointerDown={(e) => {
        if (!engineReady) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setEnabled(true);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
    >
      <i className="icon ff" />
    </button>
  );
}
