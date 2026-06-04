import TopicsTable from "@/components/partials/topics/TopicsTable";
import TopicFilters from "@/components/shared/TopicFilters";
import { styles } from "@/styles";
import { Suspense } from "react";

const Topics = () => {
  return (
    <div className="flex flex-col w-full">
      <h1 className={styles.h3}>Topics</h1>
      <div className="mt-12">
        <Suspense>
          <TopicFilters />
        </Suspense>
      </div>
      <Suspense>
        <TopicsTable />
      </Suspense>
    </div>
  );
};

export default Topics;
