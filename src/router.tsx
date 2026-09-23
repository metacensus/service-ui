import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/toaster";
import Providers from "@/app/providers";

import LogIn from "@/app/(marketing)/log-in/page";
import SignUp from "@/app/(marketing)/sign-up/page";
import NotFoundPage from "@/app/(marketing)/not-found/page";

// Authenticated pages
import Dashboard from "@/app/(authenticated)/dashboard/page";
import Contributors from "@/app/(authenticated)/contributors/page";
import Topics from "@/app/(authenticated)/topics/page";
import TopicDashboard from "@/app/(authenticated)/topics/[topicId]/topic-dashboard/page";
import TopicDetails from "@/app/(authenticated)/topics/[topicId]/topic-details/page";
import TopicPapers from "@/app/(authenticated)/topics/[topicId]/topic-papers/page";
import TopicPaper from "@/app/(authenticated)/topics/[topicId]/topic-papers/[paperId]/page";
import TopicContributors from "@/app/(authenticated)/topics/[topicId]/topic-contributors/page";
import TopicConsensusStatements from "@/app/(authenticated)/topics/[topicId]/topic-consensus-statements/page";
import TopicExtraction from "@/app/(authenticated)/topics/[topicId]/topic-extraction/[paperId]/page";
import TopicReview from "@/app/(authenticated)/topics/[topicId]/topic-review/page";
import TopicReviewUnit from "@/app/(authenticated)/topics/[topicId]/topic-review/units/[unitId]/page";
import TopicReviewSchema from "@/app/(authenticated)/topics/[topicId]/topic-review/schema/page";
import TopicReviewData from "@/app/(authenticated)/topics/[topicId]/topic-review/data/page";
import TopicAnalysis from "@/app/(authenticated)/topics/[topicId]/topic-analysis/page";
import { TABLE_STATE_PARAMS } from "@/features/reviewer-workspace/model/returnContext";
import {
  parseDataMode,
  readLastDataMode,
  resolveDataMode,
} from "@/features/reviewer-workspace/model/dataMode";

// Topic layout — ports `app/(authenticated)/topics/[topicId]/layout.tsx`.
import PageHeader from "@/components/partials/PageHeader";
import { PushRecentlyViewedTopic } from "@/app/(authenticated)/topics/[topicId]/PushRecentlyViewedTopic";

// ---------------------------------------------------------------------------
// Root route — ports `app/layout.tsx` + `app/providers.tsx`.
// ---------------------------------------------------------------------------
const rootRoute = createRootRoute({
  component: () => (
    <Providers>
      <Outlet />
      <Toaster />
    </Providers>
  ),
});

// ---------------------------------------------------------------------------
// Authenticated layout — ports `app/(authenticated)/layout.tsx`.
// ---------------------------------------------------------------------------
const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  beforeLoad: async () => {
  },
  component: () => (
    <>
      <div className="min-h-screen bg-background font-sans antialiased mx-6 xl:mx-24 my-8">
        <Outlet />
      </div>
    </>
  ),
});

// ---------------------------------------------------------------------------
// Topic layout — ports `app/(authenticated)/topics/[topicId]/layout.tsx`.
// Wraps every topic sub-page with the topic title header, the sub-navigation
// tab bar, and the recently-viewed side effect. (topicId is already decoded by
// TanStack Router — do NOT decodeURIComponent it again.)
// ---------------------------------------------------------------------------
const topicLayoutRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/topics/$topicId",
  component: function TopicLayout() {
    const { topicId } = topicLayoutRoute.useParams();
    return (
      <>
        <PageHeader pageName="topics" id={topicId} titleProp="name" />
        <PushRecentlyViewedTopic topicId={topicId} />
        <Outlet />
      </>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});

const logInRoute = createRoute({
  getParentRoute: () => rootRoute,
  component: LogIn,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  component: SignUp,
});

// --- Authenticated routes --------------------------------------------------
const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/dashboard",
  component: Dashboard,
});

const contributorsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/contributors",
  component: Contributors,
});

const topicsRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/topics",
  component: Topics,
});

const topicDashboardRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-dashboard",
  component: function TopicDashboardRoute() {
    const { topicId } = topicDashboardRoute.useParams();
    return <TopicDashboard params={{ topicId }} />;
  },
});

const topicDetailsRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-details",
  component: function TopicDetailsRoute() {
    const { topicId } = topicDetailsRoute.useParams();
    return <TopicDetails params={{ topicId }} />;
  },
});

const topicPapersRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-papers",
  component: function TopicPapersRoute() {
    const { topicId } = topicPapersRoute.useParams();
    return <TopicPapers params={{ topicId }} />;
  },
});

const topicPaperRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-papers/$paperId",
  component: function TopicPaperRoute() {
    const { topicId, paperId } = topicPaperRoute.useParams();
    return <TopicPaper params={{ topicId, paperId }} />;
  },
});

const topicContributorsRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-contributors",
  component: function TopicContributorsRoute() {
    const { topicId } = topicContributorsRoute.useParams();
    return <TopicContributors params={{ topicId }} />;
  },
});

const topicConsensusStatementsRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-consensus-statements",
  component: function TopicConsensusStatementsRoute() {
    const { topicId } = topicConsensusStatementsRoute.useParams();
    return <TopicConsensusStatements params={{ topicId }} />;
  },
});

const topicExtractionRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-extraction/$paperId",
  component: function TopicExtractionRoute() {
    const { topicId, paperId } = topicExtractionRoute.useParams();
    return <TopicExtraction params={{ topicId, paperId }} />;
  },
});

const topicReviewRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-review",
  component: function TopicReviewRoute() {
    const { topicId } = topicReviewRoute.useParams();
    return <TopicReview params={{ topicId }} />;
  },
});

const topicReviewUnitRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-review/units/$unitId",
  component: function TopicReviewUnitRoute() {
    const { topicId, unitId } = topicReviewUnitRoute.useParams();
    return <TopicReviewUnit params={{ topicId, unitId }} />;
  },
});

const topicReviewSchemaRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-review/schema",
  component: function TopicReviewSchemaRoute() {
    const { topicId } = topicReviewSchemaRoute.useParams();
    return <TopicReviewSchema params={{ topicId }} />;
  },
});

const topicReviewDataRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-review/data",
  validateSearch: (search: Record<string, unknown>) => ({
    mode: parseDataMode(search.mode) ?? undefined,
    // Declared so TanStack Router preserves them through navigate/search.
    ...Object.fromEntries(
      TABLE_STATE_PARAMS.map((k) => [
        k,
        typeof search[k] === "string" ? search[k] : undefined,
      ])
    ),
  }),
  beforeLoad: ({ search }) => {
    if (search.mode) return;
    const stored = readLastDataMode(localStorage);
    throw redirect({
      to: ".",
      search: { ...search, mode: resolveDataMode(null, stored) },
    });
  },
  component: function TopicReviewDataRoute() {
    const { topicId } = topicReviewDataRoute.useParams();
    return <TopicReviewData params={{ topicId }} />;
  },
});

const topicAnalysisRoute = createRoute({
  getParentRoute: () => topicLayoutRoute,
  path: "topic-analysis",
  component: TopicAnalysis,
});

// ---------------------------------------------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  logInRoute,
  signUpRoute,
  authenticatedLayoutRoute.addChildren([
    dashboardRoute,
    contributorsRoute,
    topicsRoute,
    topicLayoutRoute.addChildren([
      topicDashboardRoute,
      topicDetailsRoute,
      topicPapersRoute,
      topicPaperRoute,
      topicContributorsRoute,
      topicConsensusStatementsRoute,
      topicExtractionRoute,
      topicReviewRoute,
      topicReviewUnitRoute,
      topicReviewSchemaRoute,
      topicReviewDataRoute,
      topicAnalysisRoute,
    ]),
  ]),
]);

// `root` mode renders the 404 at the root route instead of inside the deepest
// matched layout, so an unknown path under `/topics/$topicId` gets the
export const router = createRouter({
  routeTree,
  notFoundMode: "root",
  defaultNotFoundComponent: NotFoundPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
