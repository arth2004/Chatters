// api.js
import { axiosInstance } from "./axios";

/**
 * Global response interceptor
 * - lets us handle 401 in one place
 * - optional: show a toast or redirect to login
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // you can inspect error.response?.status
    if (error.response?.status === 401) {
      // e.g., optional global handling:
      // window.location.href = "/login";
      // or dispatch logout action
      console.warn("Unauthorized — maybe redirect to login");
    }
    return Promise.reject(error);
  }
);

// simple helper to extract data and keep functions concise
const getData = (res) => res.data;

export const signup = (signupData) =>
  axiosInstance.post("/auth/signup", signupData).then(getData);

export const login = (loginData) =>
  axiosInstance.post("/auth/login", loginData).then(getData);

export const logout = () =>
  axiosInstance.post("/auth/logout").then(getData);

/**
 * getAuthUser: special-case to return null on error (common pattern)
 * so UI can treat `null` as unauthenticated without try/catch everywhere.
 */
export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (err) {
    // optionally inspect err.response?.status === 401
    console.log("Error in getAuthUser:", err);
    return null;
  }
};

export const completeOnboarding = (userData) =>
  axiosInstance.post("/auth/onboarding", userData).then(getData);

export const getUserFriends = () =>
  axiosInstance.get("/users/friends").then(getData);

export const getRecommendedUsers = () =>
  axiosInstance.get("/users").then(getData);

export const getOutgoingFriendReqs = () =>
  axiosInstance.get("/users/outgoing-friend-requests").then(getData);

export const sendFriendRequest = (userId) =>
  axiosInstance.post(`/users/friend-request/${userId}`).then(getData);

export const getFriendRequests = () =>
  axiosInstance.get("/users/friend-requests").then(getData);

export const acceptFriendRequest = (requestId) =>
  axiosInstance
    .put(`/users/friend-request/${requestId}/accept`)
    .then(getData);

export const getStreamToken = () =>
  axiosInstance.get("/chat/token").then(getData);
