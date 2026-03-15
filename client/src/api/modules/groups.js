import { client } from "../client";

const groupEndpoints = {
  createGroup: "/groups/new",
  getAll: "/groups/all",
  getExpenses: (id, page) => `/groups/group/chat?id=${id}&page=${page}`,
  getMembers: (id) => `/groups/group/members?id=${id}`,
  getAllNotifications: "/users/notifications",
  readNotifications: (id) => `/users/notifications/read?id=${id}`,
};

export default {
  createGroup: async (payload) => client.post(groupEndpoints.createGroup, payload),
  getAllGroups: async () => client.get(groupEndpoints.getAll),
  getGroupMembers: async (id) => client.get(groupEndpoints.getMembers(id)),
  getGroupExpenses: async (id, page) =>
    client.get(groupEndpoints.getExpenses(id, page)),
  getAllNotifications: async () => client.get(groupEndpoints.getAllNotifications),
  readNotifications: async (id) => client.put(groupEndpoints.readNotifications(id)),
};
