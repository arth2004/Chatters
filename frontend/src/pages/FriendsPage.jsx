import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserFriends,
  getFriendRequests,
  getRecommendedUsers,
  getOutgoingFriendReqs,
  sendFriendRequest,
  acceptFriendRequest,
} from "../lib/api";
import { CheckCircleIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { capitialize } from "../lib/utils";

const normalizeUser = (obj) => {
  if (!obj) return null;
  if (obj.user) return obj.user;
  if (obj.sender) return obj.sender;
  if (obj.recipient) return obj.recipient;
  if (obj.friend) return obj.friend;
  return obj;
};

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("friends"); // friends | requests | suggested

  // friends
  const { data: friendsRaw = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // incoming friend requests
  const { data: requestsRaw = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // recommended users
  const { data: recommendedRaw = [], isLoading: loadingRecommended } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: getRecommendedUsers,
  });

  // outgoing friend requests (to mark buttons as "Request Sent")
  const { data: outgoingRaw = [] } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  // normalize shapes to arrays of user objects
  const friends = useMemo(
    () => (Array.isArray(friendsRaw) ? friendsRaw.map(normalizeUser) : []),
    [friendsRaw]
  );

  const requests = useMemo(
    () =>
      Array.isArray(requestsRaw)
        ? requestsRaw.map((r) => ({ ...r, from: normalizeUser(r.sender || r) }))
        : [],
    [requestsRaw]
  );

  const recommendedUsers = useMemo(
    () => (Array.isArray(recommendedRaw) ? recommendedRaw.map(normalizeUser) : []),
    [recommendedRaw]
  );

  // ---------- FIX: derive outgoingRequestsIds with useMemo (no state/effect) ----------
  const outgoingRequestsIds = useMemo(() => {
    const s = new Set();
    if (Array.isArray(outgoingRaw)) {
      outgoingRaw.forEach((req) => {
        // try several shapes safely
        const recipient = normalizeUser(req.recipient) || req.recipient || req;
        const id = recipient?._id ?? recipient?.id ?? null;
        if (id) s.add(id);
      });
    }
    return s;
  }, [outgoingRaw]);
  // ------------------------------------------------------------------------------------

  // Mutations
  const sendReqMutation = useMutation({
    mutationFn: (userId) => sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
    },
  });

  const acceptReqMutation = useMutation({
    mutationFn: (requestId) => acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  // helper UI components
  const LoadingArea = () => (
    <div className="flex justify-center py-12">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );

  const renderFriendsGrid = () => {
    if (loadingFriends) return <LoadingArea />;
    if (!friends || friends.length === 0) return <NoFriendsFound />;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {friends.map((f) => (
          <FriendCard key={f._id ?? f.id} friend={f} />
        ))}
      </div>
    );
  };

  const renderRequests = () => {
    if (loadingRequests) return <LoadingArea />;
    if (!requests || requests.length === 0)
      return <div className="card bg-base-200 p-6 text-center">No pending requests</div>;

    return (
      <div className="space-y-4">
        {requests.map((req) => {
          const user = normalizeUser(req.sender || req.from);
          const idForKey = req._id ?? user?._id ?? JSON.stringify(req);
          return (
            <div key={idForKey} className="card bg-base-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="avatar size-12 rounded-full">
                    <img src={user?.profilePic} alt={user?.fullName || user?.name} />
                  </div>
                  <div>
                    <div className="font-medium">{user?.fullName ?? user?.name ?? "Unknown"}</div>
                    {user?.bio && <div className="text-sm opacity-70">{user.bio}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => acceptReqMutation.mutate(req._id)}
                    disabled={acceptReqMutation.isLoading}
                  >
                    <CheckCircleIcon className="mr-2 size-4" />
                    Accept
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSuggested = () => {
    if (loadingRecommended) return <LoadingArea />;
    // filter out existing friends
    const friendsIds = new Set(friends.map((f) => f._id));
    const suggested = (recommendedUsers || []).filter((u) => !friendsIds.has(u._id));

    if (!suggested || suggested.length === 0)
      return (
        <div className="card bg-base-200 p-6 text-center">
          <h3 className="font-semibold">No suggestions for now</h3>
          <p className="opacity-70">Check back later for more learners.</p>
        </div>
      );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggested.map((user) => {
          const hasSent = outgoingRequestsIds.has(user._id);
          return (
            <div key={user._id} className="card bg-base-200 hover:shadow-lg transition-all duration-300">
              <div className="card-body p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="avatar size-16 rounded-full">
                    <img src={user.profilePic} alt={user.fullName ?? user.name} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.fullName ?? user.name}</h3>
                    {user.location && (
                      <div className="flex items-center text-xs opacity-70 mt-1">
                        <UsersIcon className="size-3 mr-1" />
                        {user.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="badge badge-secondary">
                    {getLanguageFlag(user.nativeLanguage)} Native: {capitialize(user.nativeLanguage)}
                  </span>
                  <span className="badge badge-outline">
                    {getLanguageFlag(user.learningLanguage)} Learning: {capitialize(user.learningLanguage)}
                  </span>
                </div>

                {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                <button
                  className={`btn w-full mt-2 ${hasSent ? "btn-disabled" : "btn-primary"}`}
                  onClick={() => sendReqMutation.mutate(user._id)}
                  disabled={hasSent || sendReqMutation.isLoading}
                >
                  {hasSent ? (
                    <>
                      <CheckCircleIcon className="size-4 mr-2" />
                      Request Sent
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="size-4 mr-2" />
                      Send Friend Request
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Friends</h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>

        <div className="card bg-base-200 p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("friends")}
              className={`btn btn-sm ${activeTab === "friends" ? "btn-active" : "btn-ghost"}`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`btn btn-sm ${activeTab === "requests" ? "btn-active" : "btn-ghost"}`}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab("suggested")}
              className={`btn btn-sm ${activeTab === "suggested" ? "btn-active" : "btn-ghost"}`}
            >
              Suggested
            </button>
          </div>

          <div>
            {activeTab === "friends" && renderFriendsGrid()}
            {activeTab === "requests" && renderRequests()}
            {activeTab === "suggested" && renderSuggested()}
          </div>
        </div>
      </div>
    </div>
  );
}
