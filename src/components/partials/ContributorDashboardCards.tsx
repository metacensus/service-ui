"use client";

import AsyncSection from "@/components/shared/AsyncSection";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { styles } from "@/styles";
import Link from "@/components/shared/Link";
import { Topic } from "../../../types/Topic";
import { Card } from "../ui/card";

const LoadingCard = () => (
  <div className="flex-1 flex flex-col">
    <Card className="p-12 mt-4">Loading...</Card>{" "}
  </div>
);

const ErrorCard = ({ error }: { error: Error }) => (
  <div className="flex-1 flex flex-col">
    <Card className="p-12 mt-4">Error loading data: {error.message}</Card>{" "}
  </div>
);

type DashboardCardProps = {
  title: string;
  count: number;
  items: Topic[];
};

const DashboardCard = ({ title, count, items }: DashboardCardProps) => {
  return (
    <div className="flex-1 flex flex-col">
      <Card className="flex-grow flex flex-col items-start p-4 md:p-16">
        <h1 className={styles.h3}>{count}</h1>
        <p className="my-4">{title}</p>
        <div className="w-full max-w-md">
          {items.map((item: Topic) => (
            <Link key={item.id} href={`/topics/${item.id}/topic-dashboard`}>
              <p
                className="mt-4 text-sm bg-secondary rounded-lg py-1 px-2 inline-block max-w-full md:overflow-hidden md:text-ellipsis md:whitespace-nowrap"
                key={item.id}
              >
                {item.name}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ContributorDashboardCards = () => {
  const topicsQueryBody = { limit: 4, page: 1 };
  const topicsQuery = useFetchData<typeof topicsQueryBody, Topic[]>(
    routes.api.topic,
    ["topics"],
    "GET",
    undefined
  );

  return (
    <AsyncSection
      query={topicsQuery}
      isEmpty={(topics) => !topics}
      empty={null}
      loading={<LoadingCard />}
      error={topicsQuery.error && <ErrorCard error={topicsQuery.error} />}
      className="flex flex-col 2xl:flex-row w-full gap-4 mt-8"
    >
      {(topics) => (
        <DashboardCard title="Topics" count={topics.length} items={topics} />
      )}
    </AsyncSection>
  );
};

export default ContributorDashboardCards;
