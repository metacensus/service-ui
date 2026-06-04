"use client";

import ContributorDashboardCards from "@/components/partials/ContributorDashboardCards";
import DashboardUserName from "@/components/partials/dashboard/DashboardUserName";
import RecentlyReviewedTopics from "@/components/partials/RecentlyReviewedTopics";

const Dashboard = () => {
  return (
    <div className="flex flex-col w-full">
      <DashboardUserName />
      {/* <div className="w-full max-w-lg mt-12">
        <SearchTopicInput />
      </div> */}
      <ContributorDashboardCards />

      <RecentlyReviewedTopics />
    </div>
  );
};

export default Dashboard;
