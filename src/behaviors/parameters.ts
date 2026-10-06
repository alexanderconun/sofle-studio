import { BehaviorParameterValueDescription } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { hid_usage_page_and_id_from_usage } from "../hid-usages";

export function validateValue(
  layerIds: number[],
  value?: number,
  values?: BehaviorParameterValueDescription[]
): boolean {
  if (value === undefined) {
    return values === undefined || values?.length === 0 || !!values[0].nil;
  }

  const matchingValue = values?.find((v) => {
    if (v.constant !== undefined) {
      return v.constant == value;
    } else if (v.range) {
      // Ranges are uint32 in firmware but decoded as int32 (UINT32_MAX -> -1).
      const u = value >>> 0;
      return u >= v.range.min >>> 0 && u <= v.range.max >>> 0;
    } else if (v.hidUsage) {
      const [page, id] = hid_usage_page_and_id_from_usage(value);
      return page !== 0 && id !== 0;
    } else if (v.layerId) {
      return layerIds.includes(value);
    } else if (v.nil) {
      return value === 0;
    } else {
      console.error("Unknown check type!");
      return false;
    }
  });

  return !!matchingValue || (value === 0 && (!values || values.length === 0));
}

// First valid value for a parameter, so picking a behavior whose dropdown
// already shows an option (e.g. Mouse Click → MB1) actually applies it.
export function defaultValue(
  layerIds: number[],
  values?: BehaviorParameterValueDescription[]
): number {
  const v = values?.[0];
  if (v?.constant !== undefined) return v.constant;
  if (v?.range) return v.range.min >>> 0;
  if (v?.layerId) return layerIds[0] ?? 0;
  return 0;
}
