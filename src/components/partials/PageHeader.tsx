"use client";

import { useFetchData } from "@/hooks/useFetchData";
import Link from "@/components/shared/Link";
import { useMemo } from "react";
import { statusMap } from "../../../types/enums";
import TextBubble from "../shared/TextBubble";
import { Topic } from "../../../types/Topic";
import { routes } from "@/lib/routes";

type PageHeaderProps = {
  pageName: string;
  id: string;
  titleProp: keyof Topic;
};

const PageHeader = ({ pageName, id, titleProp }: PageHeaderProps) => {
  const { data: topics } = useFetchData<undefined, Topic[]>(routes.api.topic, [
    "topics",
  ]);
  const topic = topics?.find((item) => item.id === id) || null;

  const title = useMemo(() => {
    if (topic) {
      return topic[titleProp] || "";
    }
    return "";
  }, [topic, titleProp]);

  const status = useMemo(() => {
    if (topic?.status) {
      const color = statusMap[topic.status] || "gray";

      return <TextBubble text={topic.status} color={color} />;
    }
    return null;
  }, [topic]);

  const categories = useMemo(() => {
    if (topic) {
      return topic?.topicCategories?.map((item: any) => (
        <TextBubble
          key={item.category.id}
          text={item.category.name}
          color="gray"
        />
      ));
    }
    return "";
  }, [topic]);

  const tags = useMemo(() => {
    //combine the status and categories
    return [status, categories];
  }, [status, categories]);

  return (
    <div>
      <div className="flex flex-row space-x-2">
        <Link
          href={`/${pageName}`}
          className="xl:text-2xl text-mc-ink-accent font-bold capitalize cursor-pointer"
        >
          {pageName} /{" "}
        </Link>
        <div className="xl:text-2xl font-bold">
          {`${title}`}
        </div>
      </div>
      <div className="flex gap-2 mt-5 flex-wrap">{tags}</div>
    </div>
  );
};

export default PageHeader;
