import { CategoryBar } from "../components/CategoryBar";
import { PublicUserProfilePage } from "../components/PublicUserProfilePage";

export default function PublicUserProfilePageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <PublicUserProfilePage />
      </div>
    </div>
  );
}
