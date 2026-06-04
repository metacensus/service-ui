"use client";

import { useQueryState } from "@/lib/nuqs-compat";
import { useState } from "react";
import CreateTopic from "../forms/CreateTopic";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import MyDrawer from "./Drawer";

const TopicFilters = () => {
  const [openCreateTopic, setOpenCreateTopic] = useState(false);
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    clearOnDefault: true,
  });

  return (
    <div className="flex flex-col xl:flex-row gap-2 xl:items-center xl:h-10">
      <Input
        placeholder="Search"
        className="h-full max-w-sm"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
      {/* Disabled for now */}
      {/* <TopicFilterOption title="Domain" />
      <TopicFilterOption title="Category" />
      <TopicFilterOption title="Admins" />
      <TopicFilterOption title="Contributors" /> */}
      <div className="xl:ml-auto xl:mr-0">
        <Button
          variant="primary"
          className="gap-2"
          onClick={() => setOpenCreateTopic(true)}
        >
        </Button>
      </div>
      {openCreateTopic && (
        <MyDrawer
          open={openCreateTopic}
          setOpen={setOpenCreateTopic}
          title="Create New Topic"
        >
          <CreateTopic setOpen={setOpenCreateTopic} />
        </MyDrawer>
      )}
    </div>
  );
};

export default TopicFilters;
