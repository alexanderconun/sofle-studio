import { useEffect, useMemo, useState } from "react";

import {
  GetBehaviorDetailsResponse,
  BehaviorBindingParametersSet,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import { BehaviorParametersPicker } from "./BehaviorParametersPicker";
import { defaultValue, validateValue } from "./parameters";
import {
  Button,
  Header,
  ListBox,
  ListBoxItem,
  Popover,
  Section,
  Select,
  SelectValue,
} from "react-aria-components";
import { ChevronDown } from "lucide-react";
import { BehaviorInfo, CATEGORIES, CategoryId, behaviorInfo } from "./behaviorInfo";

export interface BehaviorBindingPickerProps {
  binding: BehaviorBinding;
  behaviors: GetBehaviorDetailsResponse[];
  layers: { id: number; name: string }[];
  onBindingChanged: (binding: BehaviorBinding) => void;
}

function validateBinding(
  metadata: BehaviorBindingParametersSet[],
  layerIds: number[],
  param1?: number,
  param2?: number
): boolean {
  if (
    (param1 === undefined || param1 === 0) &&
    metadata.every((s) => !s.param1 || s.param1.length === 0)
  ) {
    return true;
  }

  let matchingSet = metadata.find((s) =>
    validateValue(layerIds, param1, s.param1)
  );

  if (!matchingSet) {
    return false;
  }

  return validateValue(layerIds, param2, matchingSet.param2);
}

export const BehaviorBindingPicker = ({
  binding,
  layers,
  behaviors,
  onBindingChanged,
}: BehaviorBindingPickerProps) => {
  const [behaviorId, setBehaviorId] = useState(binding.behaviorId);
  const [param1, setParam1] = useState<number | undefined>(binding.param1);
  const [param2, setParam2] = useState<number | undefined>(binding.param2);

  const metadata = useMemo(
    () => behaviors.find((b) => b.id == behaviorId)?.metadata,
    [behaviorId, behaviors]
  );

  const sortedBehaviors = useMemo(
    () => behaviors.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [behaviors]
  );

  useEffect(() => {
    if (
      binding.behaviorId === behaviorId &&
      binding.param1 === param1 &&
      binding.param2 === param2
    ) {
      return;
    }

    if (!metadata) {
      console.error(
        "Can't find metadata for the selected behaviorId",
        behaviorId
      );
      return;
    }

    if (
      validateBinding(
        metadata,
        layers.map(({ id }) => id),
        param1,
        param2
      )
    ) {
      onBindingChanged({
        behaviorId,
        param1: param1 || 0,
        param2: param2 || 0,
      });
    }
  }, [behaviorId, param1, param2]);

  useEffect(() => {
    setBehaviorId(binding.behaviorId);
    setParam1(binding.param1);
    setParam2(binding.param2);
  }, [binding]);

  return (
    <div className="flex flex-col gap-2">
      <BehaviorSelect
        behaviors={sortedBehaviors}
        value={behaviorId}
        onChange={(id) => {
          const set = behaviors.find((b) => b.id == id)?.metadata?.[0];
          const layerIds = layers.map((l) => l.id);
          setBehaviorId(id);
          setParam1(defaultValue(layerIds, set?.param1));
          setParam2(defaultValue(layerIds, set?.param2));
        }}
      />
      {metadata && (
        <BehaviorParametersPicker
          metadata={metadata}
          behaviorName={behaviors.find((b) => b.id == behaviorId)?.displayName}
          param1={param1}
          param2={param2}
          layers={layers}
          onParam1Changed={setParam1}
          onParam2Changed={setParam2}
        />
      )}
    </div>
  );
};

const InfoCard = ({ info }: { info: BehaviorInfo }) => {
  const Icon = CATEGORIES[info.category].icon;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-primary" />
        {info.title}
      </div>
      <div className="text-base-content/60 text-[0.75rem] uppercase tracking-wide">
        {CATEGORIES[info.category].name}
      </div>
      <p className="text-[0.85rem] leading-snug">{info.long}</p>
      {info.example && (
        <p className="text-[0.8rem] text-base-content/70">
          <span className="font-semibold">Example:</span> {info.example}
        </p>
      )}
    </div>
  );
};

interface BehaviorSelectProps {
  behaviors: GetBehaviorDetailsResponse[];
  value: number;
  onChange: (id: number) => void;
}

// Grouped behavior list with icons and a one-line explanation per item;
// hovering an item shows the full explanation in the side panel.
const BehaviorSelect = ({ behaviors, value, onChange }: BehaviorSelectProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const groups = useMemo(() => {
    const byCat = new Map<CategoryId, GetBehaviorDetailsResponse[]>();
    for (const b of behaviors) {
      const cat = behaviorInfo(b.displayName).category;
      byCat.set(cat, [...(byCat.get(cat) ?? []), b]);
    }
    return (Object.keys(CATEGORIES) as CategoryId[])
      .filter((c) => byCat.has(c))
      .map((c) => ({ id: c, items: byCat.get(c)! }));
  }, [behaviors]);

  const selected = behaviors.find((b) => b.id === value);
  const preview = behaviors.find((b) => b.id === (hovered ?? value));

  return (
    <div className="flex flex-col gap-2">
      <Select
        aria-label="Behavior"
        selectedKey={value}
        onSelectionChange={(k) => onChange(Number(k))}
        onOpenChange={() => setHovered(null)}
        className="flex items-center gap-2"
      >
        <span>Behavior:</span>
        <Button className="flex items-center gap-2 h-8 rounded px-2 bg-base-100 border border-base-300 min-w-56 justify-between">
          <SelectValue>
            {selected ? behaviorInfo(selected.displayName).title : "Select…"}
          </SelectValue>
          <ChevronDown className="size-4" />
        </Button>
        {selected && (
          <span className="text-base-content/60 text-[0.85rem]">
            {behaviorInfo(selected.displayName).short}
          </span>
        )}
        <Popover className="bg-base-100 border border-base-300 rounded shadow-lg flex max-h-[28rem] w-[36rem]">
          <ListBox className="overflow-y-auto w-1/2 p-1 outline-none">
            {groups.map(({ id, items }) => {
              const Icon = CATEGORIES[id].icon;
              return (
                <Section key={id} className="mb-1">
                  <Header className="flex items-center gap-1 px-2 pt-2 pb-1 text-[0.75rem] uppercase tracking-wide text-base-content/50">
                    <Icon className="size-3" />
                    {CATEGORIES[id].name}
                  </Header>
                  {items.map((b) => {
                    const info = behaviorInfo(b.displayName);
                    return (
                      <ListBoxItem
                        key={b.id}
                        id={b.id}
                        textValue={info.title}
                        onHoverStart={() => setHovered(b.id)}
                        className="px-2 py-1 rounded cursor-default select-none outline-none rac-hover:bg-base-300 rac-focus:bg-base-300 rac-selected:text-primary"
                      >
                        <div className="font-medium">{info.title}</div>
                        <div className="text-[0.75rem] text-base-content/60">
                          {info.short}
                        </div>
                      </ListBoxItem>
                    );
                  })}
                </Section>
              );
            })}
          </ListBox>
          <div className="w-1/2 p-3 border-l border-base-300 bg-base-200">
            {preview && <InfoCard info={behaviorInfo(preview.displayName)} />}
          </div>
        </Popover>
      </Select>
    </div>
  );
};
