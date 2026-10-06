import { BehaviorParameterValueDescription } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { HidUsagePicker } from "./HidUsagePicker";

// Firmware sends terse names for some fixed options.
const FRIENDLY_NAMES: Record<string, string> = {
  MB1: "Left click",
  MB2: "Right click",
  MB3: "Middle click",
  MB4: "Back",
  MB5: "Forward",
};

export interface ParameterValuePickerProps {
  value?: number;
  values: BehaviorParameterValueDescription[];
  layers: { id: number; name: string }[];
  behaviorName?: string;
  onValueChanged: (value?: number) => void;
}

export const ParameterValuePicker = ({
  value,
  values,
  layers,
  behaviorName,
  onValueChanged,
}: ParameterValuePickerProps) => {
  if (values.length == 0) {
    return <></>;
  } else if (values.every((v) => v.constant !== undefined)) {
    return (
      <div>
        <select
          value={value}
          className="h-8 rounded"
          onChange={(e) => onValueChanged(parseInt(e.target.value))}
        >
          {values.map((v) => (
            <option value={v.constant}>{FRIENDLY_NAMES[v.name] ?? v.name}</option>
          ))}
        </select>
      </div>
    );
  } else if (values.length == 1) {
    if (values[0].range && values[0].name === "X Y") {
      return (
        <MouseDirectionPicker
          value={value}
          scroll={/scr/i.test(behaviorName ?? "")}
          onValueChanged={onValueChanged}
        />
      );
    } else if (values[0].range) {
      return (
        <div>
          <label>{values[0].name}: </label>
          <input
            type="number"
            min={values[0].range.min}
            max={values[0].range.max}
            value={value}
            onChange={(e) => onValueChanged(parseInt(e.target.value))}
          />
        </div>
      );
    } else if (values[0].hidUsage) {
      return (
        <HidUsagePicker
          onValueChanged={onValueChanged}
          label={values[0].name}
          value={value}
          usagePages={[
            { id: 7, min: 4, max: values[0].hidUsage.keyboardMax },
            { id: 12, max: values[0].hidUsage.consumerMax },
          ]}
        />
      );
    } else if (values[0].layerId) {
      return (
        <div>
          <label>{values[0].name}: </label>
          <select
            value={value}
            className="h-8 rounded"
            onChange={(e) => onValueChanged(parseInt(e.target.value))}
          >
            {layers.map(({ name, id }) => (
              <option value={id}>{name}</option>
            ))}
          </select>
        </div>
      );
    }
  } else {
    console.log("Not sure how to handle", values);
    return (
      <>
        <p>Some composite?</p>
      </>
    );
  }

  return <></>;
};

// Firmware packs mouse move/scroll as two int16s: x in the upper 16 bits,
// y in the lower 16 (see zmk dt-bindings/zmk/pointing.h).
const packXY = (x: number, y: number) =>
  (((x & 0xffff) << 16) | (y & 0xffff)) >>> 0;
const int16 = (v: number) => (v << 16) >> 16;

type Direction = "up" | "down" | "left" | "right";

// Defaults match ZMK_POINTING_DEFAULT_MOVE_VAL / SCRL_VAL in the Sofle keymap.
const DEFAULT_SPEED = { move: 1200, scroll: 25 };

export const MouseDirectionPicker = ({
  value,
  scroll,
  onValueChanged,
}: {
  value?: number;
  scroll: boolean;
  onValueChanged: (value?: number) => void;
}) => {
  const x = int16((value ?? 0) >>> 16);
  const y = int16((value ?? 0) & 0xffff);
  // Scroll "up" is +y, cursor "up" is -y.
  const upSign = scroll ? 1 : -1;
  const dir: Direction | undefined =
    y !== 0 ? (Math.sign(y) === upSign ? "up" : "down")
    : x !== 0 ? (x < 0 ? "left" : "right")
    : undefined;
  const speed =
    Math.abs(x || y) || (scroll ? DEFAULT_SPEED.scroll : DEFAULT_SPEED.move);

  const emit = (d: Direction, s: number) => {
    const v = Math.min(Math.max(Math.round(s), 1), 32767);
    onValueChanged(
      d === "up" ? packXY(0, upSign * v)
      : d === "down" ? packXY(0, -upSign * v)
      : d === "left" ? packXY(-v, 0)
      : packXY(v, 0)
    );
  };

  const arrows: [Direction, string][] = [
    ["up", "↑ Up"],
    ["down", "↓ Down"],
    ["left", "← Left"],
    ["right", "→ Right"],
  ];

  return (
    <div className="flex items-center gap-2">
      <span>{scroll ? "Scroll" : "Move"}:</span>
      {arrows.map(([d, label]) => (
        <button
          key={d}
          type="button"
          onClick={() => emit(d, speed)}
          className={`h-8 px-2 rounded border border-base-300 ${
            dir === d ? "bg-primary text-primary-content" : "bg-base-100"
          }`}
        >
          {label}
        </button>
      ))}
      <label className="ml-2">Speed:</label>
      <input
        type="number"
        min={1}
        max={32767}
        value={speed}
        disabled={!dir}
        className="h-8 w-20 rounded px-1"
        onChange={(e) => dir && emit(dir, parseInt(e.target.value) || 1)}
      />
    </div>
  );
};
