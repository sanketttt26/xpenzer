import { client } from "../client.js";

const friendsEndpoints = {
  getAll: "/friends/all",
  getFriendLike: (name) => `/friends?like=${name}`,
  getUsersLike: (name) => `/friends/users?like=${name}`,
  friendRequest: `/friends/friend-request`,
  getTransactions: (fid, start, end) =>
    `/friends/transactions?fid=${fid}&start=${start}&end=${end}`,
  settleBalance: `friends/settle-balance`,
  settleTransaction: "friends/settle-transaction",
  acceptFriendRequest: (id) => `/friends/accept-request?friendId=${id}`,
};

const friendsApi = {
  getAllFriends: async () => client.get(friendsEndpoints.getAll),
  getFriendLike: async (name) => client.get(friendsEndpoints.getFriendLike(name)),
  getUsersLike: async (name) => client.get(friendsEndpoints.getUsersLike(name)),
  friendRequest: async (fid) => client.post(friendsEndpoints.friendRequest, { id: fid }),
  getTransactions: async (fid, start, end) =>
    client.get(friendsEndpoints.getTransactions(fid, start, end)),
  settleBalance: async (fid) => client.patch(friendsEndpoints.settleBalance, { fid }),
  settleTransaction: async (fid, amount, contriId) =>
    client.put(friendsEndpoints.settleTransaction, {
      fid,
      amount,
      contriId,
    }),
  acceptFriendRequest: async (fid) =>
    client.post(friendsEndpoints.acceptFriendRequest(fid)),
};

export default friendsApi;
