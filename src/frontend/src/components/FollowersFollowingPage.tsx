import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, UserMinus, UserPlus, Users } from "lucide-react";

import { Input } from "./ui/input";
import {
  getFollowers,
  getFollowing,
  followUser,
  removeFollower,
  unfollowUser,
  type FollowUserResponse,
} from "../services/followService";

type TabKey = "followers" | "following";

interface ListState {
  items: FollowUserResponse[];
  isLoading: boolean;
  error: string | null;
}

const INITIAL_LIST_STATE: ListState = {
  items: [],
  isLoading: true,
  error: null,
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export function FollowersFollowingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("followers");
  const [searchQuery, setSearchQuery] = useState("");

  const [followers, setFollowers] = useState<ListState>(INITIAL_LIST_STATE);
  const [following, setFollowing] = useState<ListState>(INITIAL_LIST_STATE);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const markPending = useCallback((userId: string, isPending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFollowers = async () => {
      setFollowers((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await getFollowers({ pageSize: 100 });
        if (cancelled) return;
        setFollowers({ items: result.data, isLoading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load followers";
        setFollowers({ items: [], isLoading: false, error: message });
      }
    };

    const loadFollowing = async () => {
      setFollowing((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await getFollowing({ pageSize: 100 });
        if (cancelled) return;
        setFollowing({ items: result.data, isLoading: false, error: null });
        setFollowingIds(new Set(result.data.map((u) => u.id)));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load following";
        setFollowing({ items: [], isLoading: false, error: message });
      }
    };

    loadFollowers();
    loadFollowing();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFollowBack = useCallback(
    async (user: FollowUserResponse) => {
      markPending(user.id, true);
      try {
        await followUser(user.id);
        setFollowingIds((prev) => new Set(prev).add(user.id));
        setFollowing((prev) =>
          prev.items.some((u) => u.id === user.id)
            ? prev
            : {
                ...prev,
                items: [{ ...user, followersCount: user.followersCount + 1 }, ...prev.items],
              }
        );
        setFollowers((prev) => ({
          ...prev,
          items: prev.items.map((u) =>
            u.id === user.id ? { ...u, followersCount: u.followersCount + 1 } : u
          ),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to follow user";
        alert(message);
      } finally {
        markPending(user.id, false);
      }
    },
    [markPending]
  );

  const handleUnfollow = useCallback(
    async (user: FollowUserResponse) => {
      markPending(user.id, true);
      try {
        await unfollowUser(user.id);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
        setFollowing((prev) => ({ ...prev, items: prev.items.filter((u) => u.id !== user.id) }));
        setFollowers((prev) => ({
          ...prev,
          items: prev.items.map((u) =>
            u.id === user.id ? { ...u, followersCount: Math.max(0, u.followersCount - 1) } : u
          ),
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to unfollow user";
        alert(message);
      } finally {
        markPending(user.id, false);
      }
    },
    [markPending]
  );

  const handleRemoveFollower = useCallback(
    async (user: FollowUserResponse) => {
      markPending(user.id, true);
      try {
        await removeFollower(user.id);
        setFollowers((prev) => ({ ...prev, items: prev.items.filter((u) => u.id !== user.id) }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove follower";
        alert(message);
      } finally {
        markPending(user.id, false);
      }
    },
    [markPending]
  );

  const filteredFollowers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return followers.items;
    return followers.items.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [followers.items, searchQuery]);

  const filteredFollowing = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return following.items;
    return following.items.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [following.items, searchQuery]);

  const renderUserCard = (
    user: FollowUserResponse,
    options: { showRemove: boolean; isFollowing: boolean }
  ) => {
    const { showRemove, isFollowing } = options;
    const isPending = pendingIds.has(user.id);

    return (
      <div
        key={user.id}
        className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0 cursor-pointer hover:scale-105 transition-transform overflow-hidden"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user.fullName)
            )}
          </div>

          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div
              className="cursor-pointer hover:text-[#3d2e7c] transition-colors"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate mb-1">
                {user.fullName}
              </h3>
            </div>
            {user.bio && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{user.bio}</p>}
            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{user.followersCount.toLocaleString()} followers</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-2 mt-4 w-full">
          <button
            type="button"
            disabled={isPending}
            onClick={() => (isFollowing ? handleUnfollow(user) : handleFollowBack(user))}
            className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-full font-semibold transition-all duration-200 text-sm inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
              isFollowing
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white hover:shadow-lg"
            }`}
          >
            {isFollowing ? (
              <>
                <UserMinus className="w-4 h-4 mr-2" />
                Unfollow
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Follow Back
              </>
            )}
          </button>
          {showRemove && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRemoveFollower(user)}
              className="flex-1 sm:flex-none sm:px-6 py-2 rounded-full text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderEmpty = (tab: TabKey) => {
    const title = tab === "followers" ? "No followers found" : "Not following anyone";
    const hint =
      tab === "followers" ? "Start sharing to gain followers!" : "Discover and follow sellers!";
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">{title}</h3>
        <p className="text-sm sm:text-base text-gray-500">
          {searchQuery ? "Try a different search term" : hint}
        </p>
      </div>
    );
  };

  const renderList = (tab: TabKey) => {
    const state = tab === "followers" ? followers : following;
    const items = tab === "followers" ? filteredFollowers : filteredFollowing;

    if (state.isLoading) {
      return (
        <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">
          Loading…
        </div>
      );
    }
    if (state.error) {
      return (
        <div className="text-center py-12 sm:py-16 text-red-600 text-sm sm:text-base">
          {state.error}
        </div>
      );
    }
    if (items.length === 0) {
      return renderEmpty(tab);
    }
    return (
      <div className="space-y-3 sm:space-y-4">
        {items.map((user) =>
          renderUserCard(user, {
            showRemove: tab === "followers",
            isFollowing: tab === "following" ? true : followingIds.has(user.id),
          })
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => navigate("/my-profile")}
            className="flex items-center gap-2 text-gray-600 hover:text-[#3d2e7c] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">Back to Profile</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Connections</h1>
            <p className="text-purple-200 text-sm sm:text-base">
              Manage your followers and following
            </p>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-11 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="bg-gray-100 p-1 rounded-xl w-full sm:max-w-md flex">
              <button
                type="button"
                onClick={() => setActiveTab("followers")}
                className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  activeTab === "followers"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Followers ({filteredFollowers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("following")}
                className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  activeTab === "following"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Following ({filteredFollowing.length})
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">{renderList(activeTab)}</div>
        </div>
      </div>
    </div>
  );
}
