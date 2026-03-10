type Props = {
  namesInput: string;
  namesCount: number;
  onChange: (value: string) => void;
};

export function ParticipantsCard({ namesInput, namesCount, onChange }: Props) {
  return (
    <section className="card">
      <h2>참가자 입력</h2>
      <textarea
        rows={8}
        placeholder={'한 줄에 한 명씩 입력\n예) 김철수\n홍길동/2\n이영희*2'}
        value={namesInput}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="muted">현재 인원: {namesCount}명</p>
    </section>
  );
}
