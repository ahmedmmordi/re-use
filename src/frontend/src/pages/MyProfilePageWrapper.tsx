import { CategoryBar } from "../components/CategoryBar";
import { MyProfilePage } from "../components/MyProfilePage";

export default function MyProfilePageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <MyProfilePage />
      </div>
    </div>
  );
}
