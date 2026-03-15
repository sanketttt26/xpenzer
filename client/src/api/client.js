import axios from "axios";
import queryString from "query-string";
import { setupCache } from "axios-cache-interceptor";

const normalizeApiError = (error) => {
  const responseData = error?.response?.data;

  if (responseData && typeof responseData === "object") {
    return {
      ...responseData,
      status: error.response?.status,
    };
  }

  return {
    message:
      responseData || error?.message || "Something went wrong, please try again",
    status: error?.response?.status,
  };
};

// CLIENT REQUEST CONFIG
export const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVER_URL,
  paramsSerializer: {
    encode: (params) => queryString.stringify(params),
  },
  withCredentials: true,
});

export const client = setupCache(api);

client.interceptors.request.use(async (config) => {
  return { ...config };
});

client.interceptors.response.use(
  (res) => {
    if (res && res.data) return res.data;
    return res;
  },
  (err) => {
    throw normalizeApiError(err);
  },
);
