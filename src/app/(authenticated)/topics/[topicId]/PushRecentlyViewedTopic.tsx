"use client";

import { get, set } from "@/lib/indexdb";
import { FC, useEffect } from "react";

export const PushRecentlyViewedTopic: FC<{ topicId: string }> = ({
  topicId,
}) => {
  useEffect(() => {
    const pushRecentlyViewedTopic = async () => {
      const recentlyViewedTopics = await get<string[]>("recentlyViewedTopics");

      if (!recentlyViewedTopics)
        return await set("recentlyViewedTopics", [topicId]);

      if (recentlyViewedTopics.includes(topicId)) {
        const index = recentlyViewedTopics.indexOf(topicId);
        recentlyViewedTopics.splice(index, 1);

        recentlyViewedTopics.push(topicId);

        // push the first 10 topics into the array
        return await set(
          "recentlyViewedTopics",
          recentlyViewedTopics.slice(0, 5)
        );
      }

      recentlyViewedTopics.push(topicId);
      await set("recentlyViewedTopics", recentlyViewedTopics.slice(0, 5));
    };

    pushRecentlyViewedTopic();
  }, [topicId]);

  return null;
};
