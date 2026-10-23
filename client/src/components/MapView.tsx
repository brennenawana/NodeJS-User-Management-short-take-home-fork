import { isLocated, type User, type ZipPreview } from "../api";
import { BANDS, pinSide, project } from "../lib/map";
import { localClock, offsetLabel } from "../lib/time";
import { MapPin, PreviewPin } from "./MapPin";
import styles from "./MapView.module.css";

// Outline and lakes from design/source/R2-Main.dc.html, in a 590×266 viewBox.
const LAND = "M3,16 L17,10 L298,10 L304,7 L330,15 L355,19 L380,18 L400,24 L405,34 L415,40 L426,47 L429,65 L426,70 L420,80 L433,85 L449,79 L461,71 L474,68 L485,65 L488,58 L500,50 L535,50 L550,35 L570,27 L572,43 L580,52 L565,58 L548,64 L550,83 L535,86 L525,90 L510,94 L508,105 L495,112 L490,130 L495,147 L471,161 L451,173 L439,180 L436,196 L444,216 L449,242 L441,249 L432,240 L423,222 L420,210 L410,199 L400,203 L375,197 L370,196 L356,210 L345,207 L330,204 L312,203 L302,207 L278,223 L278,241 L255,225 L241,206 L218,210 L205,204 L185,182 L168,182 L168,187 L140,187 L102,175 L79,175 L65,160 L45,155 L31,134 L25,122 L13,110 L6,96 L8,80 L10,55 L11,38 L4,25 Z";
const LAKES = [
  "M329,33 L338,25 L352,20 L378,19 L398,25 L404,34 L395,37 L380,36 L365,32 L348,35 Z",
  "M375,84 L387,75 L388,60 L395,47 L394,41 L382,43 L375,48 L370,55 L373,65 L374,75 Z",
  "M404,41 L415,39 L426,46 L430,60 L428,70 L420,68 L412,60 L406,50 Z",
  "M422,84 L433,86 L449,80 L461,72 L458,77 L445,84 L430,89 Z",
  "M462,70 L474,68 L485,65 L488,60 L480,62 L470,66 Z",
];

interface Props {
  users: User[];
  /** Ids that pass the current search and zone filter; the rest are dimmed. */
  visible: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: Date;
  /** The zip being added, once it resolves. */
  preview?: ZipPreview | null;
}

export function MapView({ users, visible, selectedId, onSelect, now, preview }: Props) {
  const located = users.filter(isLocated);
  const points = located.map((u) => ({ id: u.id, lat: u.lat, lon: u.lon }));
  const selected = located.find((u) => u.id === selectedId);
  const previewAt = preview && project(preview.lat, preview.lon);
  return (
    <section aria-label="Map of people" className={styles.map}>
      <div className={styles.head}>
        <h2 className={styles.title}>Where everyone is</h2>
        <p className={styles.sub}>Contiguous US · bands are UTC offsets</p>
        <p className={styles.hint} aria-live="polite">{selected ? `Showing ${selected.name} below` : "Press a pin to open their card"}</p>
      </div>
      <div className={styles.canvas}>
        <svg viewBox="0 0 590 266" className={styles.svg} role="img" aria-label="Stylised map of the contiguous United States with UTC offset bands">
          <rect width="590" height="266" rx="12" className={styles.sea} />
          <path d="M0 100H590M0 200H590" className={styles.grid} />
          <path d={LAND} className={styles.land} />
          <g className={styles.lakes}>{LAKES.map((d) => <path key={d} d={d} />)}</g>
          <g className={styles.band}>
            {BANDS.filter((b) => b.shaded).map((b) => <rect key={b.label} x={b.x} width={b.w} height="266" rx={b.x === 0 ? 12 : 0} />)}
          </g>
          <path d="M110 0V266M230 0V266M390 0V266" className={styles.edges} />
          {BANDS.map((b) => <text key={b.label} x={b.x + b.w / 2} y="258" className={styles.bandLabel}>{b.label}</text>)}
        </svg>
        {located.map((u) => {
          const { x, y } = project(u.lat, u.lon);
          return (
            <MapPin key={u.id} name={u.name} x={x} y={y} side={pinSide({ id: u.id, lat: u.lat, lon: u.lon }, points)}
              selected={u.id === selectedId} dimmed={!visible.has(u.id)} onClick={() => onSelect(u.id)}
              label={`${u.name}, ${u.city} ${offsetLabel(u.utcOffsetSeconds)}, local time ${localClock(u.utcOffsetSeconds, now).text}`} />
          );
        })}
        {preview && previewAt && <PreviewPin x={previewAt.x} y={previewAt.y} label={`${preview.city} · ${offsetLabel(preview.utcOffsetSeconds)}`} />}
      </div>
    </section>
  );
}
