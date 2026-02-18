export const decimalTransformer = {
  to: (value?: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
