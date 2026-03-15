import { client } from "../client";

const spendingsEndpoints = {
  getAllSpendings: (page, dateRange) =>
    `/spendings/get-all?start=${dateRange.start}&end=${dateRange.end}&page=${page}`,
  getById: (id) => `/spendings/spending/${id}`,
  getSpendingsAmount: "/spendings/total",
  newSpending: "/spendings/spending/new",
  voiceExpense: "/voice-expense",
};

export const spendingsApi = {
  getAllSpendings: async ({ limit, dateRange }) =>
    client.get(spendingsEndpoints.getAllSpendings(limit, dateRange)),
  getById: async ({ id }) => client.get(spendingsEndpoints.getById(id)),
  getTotalSpendings: async () => client.get(spendingsEndpoints.getSpendingsAmount),
  parseVoiceExpense: async (payload) =>
    client.post(spendingsEndpoints.voiceExpense, payload),
  newSpending: async (payload) => {
    try {
      console.log(JSON.stringify(payload));
      const res = await client.post(spendingsEndpoints.newSpending, payload);
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
