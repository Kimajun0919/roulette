type Props = {
  engineReady: boolean;
  lastMessage: string | null;
};

export function EngineStatusCard({ engineReady, lastMessage }: Props) {
  return (
    <p className={`engine-status ${engineReady ? 'ready' : 'loading'}`}>
      {engineReady ? lastMessage ?? 'Stage ready.' : 'Loading maps and physics engine...'}
    </p>
  );
}
