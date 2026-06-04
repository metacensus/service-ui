"use client";

import CreateMetaAnalysisQuestion from "@/components/forms/CreateMetaAnalysisQuestion/CreateMetaAnalysisQuestion";
import CreatePaper from "@/components/forms/CreatePaper/CreatePaper";
import CreateProtocol from "@/components/forms/CreateProtocol/CreateProtocol";
import EditProtocol from "@/components/forms/EditProtocol/EditProtocol";
import TopicActionItems from "@/components/partials/topics/TopicActionItems";
import TopicPaperStatuses from "@/components/partials/topics/TopicPaperStatuses";
import TopicProtocolView from "@/components/partials/topics/TopicProtocolView";
import MyDrawer from "@/components/shared/Drawer";
import IconButton from "@/components/shared/IconButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchData } from "@/hooks/useFetchData";
import { routes } from "@/lib/routes";
import { useMemo, useState } from "react";
import { Prop } from "../../../../../../types/Prop";
import { Protocol } from "../../../../../../types/Protocol";
import { Topic } from "../../../../../../types/Topic";

interface Props {
  params: { topicId: string };
}


const TopicsDashboard = ({ params }: Props) => {


    "GET"
  );


  );

    routes.api.topicProtocol(topicId),
    [`topic-protocol-${topicId}`]
  );


  const [createProtocolOpen, setCreateProtocolOpen] = useState(false);
  const [createPaperOpen, setCreatePaperOpen] = useState(false);
  const [viewProtocolOpen, setViewProtocolOpen] = useState(false);
  const [editProtocolOpen, setEditProtocolOpen] = useState(false);
      </div>
    </div>
  );

    <div className="flex flex-col w-full">
      <div className="mt-2 w-full flex justify-end items-center gap-2">
        <TopicActionItems topicId={topicId} />
        {!!protocol && (
          <Button
            size="sm"
            variant="primary"
            className="gap-2 px-2 py-1"
            onClick={() => setCreatePaperOpen(true)}
          >
            <span className="text-xs">Submit Paper</span>
          </Button>
        )}
      </div>
        />
      </div>
                </p>
            >
                <div className="flex gap-2 flex-wrap">
                  <IconButton
                    text="View Protocol"
                    type="button"
                  />
                  <IconButton
                    text="Edit Protocol"
                    type="button"
                  />
                </div>
          </CardContent>
        </Card>
        {!!protocol && (
            <CardTitle className="text-xl">Papers</CardTitle>
            <CardContent className="p-0">
              <TopicPaperStatuses topicId={topicId} />
            </CardContent>
          </Card>
        )}
      </div>
        />
      </div>


      {createProtocolOpen && (
        <MyDrawer
          open={createProtocolOpen}
          setOpen={setCreateProtocolOpen}
          title="Create Protocol"
          secondaryTitle={`for ${topic?.name}`}
        >
          <CreateProtocol
            topicId={topicId}
            setDrawerOpen={setCreateProtocolOpen}
          />
        </MyDrawer>
      )}
      {createPaperOpen && (
        <MyDrawer
          open={createPaperOpen}
          setOpen={setCreatePaperOpen}
          title={`Submit Paper to ${topic?.name}`}
        >
          <CreatePaper topicId={topicId} setDrawerOpen={setCreatePaperOpen} />
        </MyDrawer>
      )}
      {viewProtocolOpen && (
        <MyDrawer
          open={viewProtocolOpen}
          setOpen={setViewProtocolOpen}
          title="View Protocol"
          secondaryTitle={`for ${topic?.name}`}
        >
          <TopicProtocolView topicId={topicId} />
        </MyDrawer>
      )}
      {editProtocolOpen && protocol && (
        <MyDrawer
          open={editProtocolOpen}
          setOpen={setEditProtocolOpen}
          title="Edit Protocol"
          secondaryTitle={`for ${topic?.name}`}
        >
          <EditProtocol
            topicId={topicId}
            protocol={protocol}
            setDrawerOpen={() => setEditProtocolOpen(false)}
          />
        </MyDrawer>
      )}
        <MyDrawer
          secondaryTitle={`for ${topic?.name}`}
        >
          <CreateMetaAnalysisQuestion
            topicId={topicId}
          />
        </MyDrawer>
      )}
    </div>
  );
};

export default TopicsDashboard;
