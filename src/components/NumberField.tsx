import { useEffect, useState } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function NumberField({ value, onChange, min, max, step, className = 'input' }: Props) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      value={text}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const n = Number(raw);
        if (raw.trim() !== '' && !Number.isNaN(n)) onChange(n);
      }}
      onBlur={() => {
        if (text.trim() === '' || Number.isNaN(Number(text))) setText(String(value));
      }}
      className={className}
    />
  );
}
