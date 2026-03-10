type Props = {
  namesInput: string;
  namesCount: number;
  onChange: (value: string) => void;
  onShuffle: () => void;
};

export function ParticipantsCard({ namesInput, namesCount, onChange, onShuffle }: Props) {
  return (
    <section className="card">
      <h2>참가자 입력</h2>
      <textarea
        rows={8}
        placeholder={'한 줄에 한 명씩 입력\n예) 김철수\n홍길동/2\n이영희*2'}
        value={namesInput}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" onClick={onShuffle} disabled={namesCount < 2}>
          순서 셔플
        </button>
      </div>
      <p className="muted">현재 인원: {namesCount}명</p>
    </section>
  );
}
