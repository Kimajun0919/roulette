type Props = {
  engineReady: boolean;
  namesCount: number;
  onStart: () => void;
  onShuffle: () => void;
  onOpenNotice: () => void;
};

const SHOP_IMAGE_URL = new URL('../../assets/images/marblerouletteshop.png', import.meta.url).toString();

export function RunCard({ engineReady, namesCount, onStart, onShuffle, onOpenNotice }: Props) {
  return (
    <div className="actions">
      <button id="btnNotice" type="button" onClick={onOpenNotice}>
        <i className="icon megaphone" />
      </button>
      <a href="https://marblerouletteshop.com" target="_blank" rel="noreferrer" id="btnShop" className="btn new" title="MarbleRoulette Shop">
        <img src={SHOP_IMAGE_URL} alt="MarbleRoulette Shop" />
      </a>
      <div className="sep" />
      <button id="btnShuffle" type="button" onClick={onShuffle} disabled={namesCount < 2}>
        <i className="icon shuffle" />
        <span>Shuffle</span>
      </button>
      <button id="btnStart" type="button" onClick={onStart} disabled={!engineReady || namesCount === 0}>
        <i className="icon play" />
        <span>Start</span>
      </button>
    </div>
  );
}
