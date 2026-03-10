type Props = {
  namesInput: string;
  namesCount: number;
  onChange: (value: string) => void;
};

export function ParticipantsCard({ namesInput, namesCount, onChange }: Props) {
  return (
    <>
      <h3>Enter names below</h3>
      <textarea
        id="in_names"
        rows={5}
        placeholder="Input names separated by commas or line feed here"
        value={namesInput}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="settings-help">Entries: {namesCount}</p>
    </>
  );
}
