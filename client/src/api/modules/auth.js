import { client } from "../client";

const authEndpoints = {
  login: "/users/user/login",
  signup: "/users/user/signup",
  autoLogin: "/users/user/auth",
};

export const authApi = {
  login: async (auth) => client.post(authEndpoints.login, auth),
  signup: async (auth) => client.post(authEndpoints.signup, auth),
  autoLogin: async () => client.get(authEndpoints.autoLogin),
};
