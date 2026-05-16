import { CategoryBar } from "../components/CategoryBar";
import { FollowersFollowingPage } from "../components/FollowersFollowingPage";

export default function FollowersFollowingPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <FollowersFollowingPage />
      </div>
    </div>
  );
}
