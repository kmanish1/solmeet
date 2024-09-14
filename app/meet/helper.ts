interface Slot {
  time: string;
}

interface SlotData {
  [date: string]: Slot[];
}

interface Option {
  label: string;
  value: string;
}

interface ActionParameterSelectable<Type extends string> {
  type: Type;
  label: string;
  options: Option[];
  name: string;
}

type SelectActionParameter = ActionParameterSelectable<"select">;

export const createSlotObjects = (slots: SlotData): SelectActionParameter[] => {
  return Object.entries(slots).reduce<SelectActionParameter[]>(
    (acc, [date, times]) => {
      if (times.length > 0) {
        acc.push({
          type: "select",
          label: `Select a slot for ${date}`,
          options: [
            {
              label: "None",
              value: "none",
            },
            ...times.map((slot) => ({
              label: new Date(slot.time).toLocaleTimeString(),
              value: slot.time,
            })),
          ],
          name: date,
        });
      }
      return acc;
    },
    []
  );
};

interface ActionData {
  account: string;
  data: Record<string, string>;
}

export function validateActionData(actionData: ActionData) {
  const { data } = actionData;

  const isISOString = (value: string): boolean => {
    return value !== "none" && !isNaN(Date.parse(value));
  };

  const isoStringCount = Object.values(data).filter(isISOString).length;

  if (isoStringCount > 1) {
    throw new Error("Multiple ISO date strings are not allowed.");
  }
  if (isoStringCount === 0) {
    throw new Error("No slot selected");
  }
  return Object.values(data).filter(isISOString)[0];
}
