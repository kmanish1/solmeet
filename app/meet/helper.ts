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

// Define the specific type for 'select'
type SelectActionParameter = ActionParameterSelectable<"select">;

export const createSlotObjects = (slots: SlotData): SelectActionParameter[] => {
  return Object.entries(slots).reduce<SelectActionParameter[]>(
    (acc, [date, times]) => {
      if (times.length > 0) {
        acc.push({
          type: "select",
          label: `Select a slot for ${date}`,
          options: times.map((slot) => ({
            label: new Date(slot.time).toLocaleTimeString(),
            value: slot.time + date,
          })),
          name: date,
        });
      }
      return acc;
    },
    []
  );
};
