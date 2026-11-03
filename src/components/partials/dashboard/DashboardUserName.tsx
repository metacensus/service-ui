import AsyncSection from "@/components/shared/AsyncSection";
import { useSelf } from "@/hooks/useGetUserId";
import { styles } from "@/styles";

const DashboardUserName = () => {
  const selfQuery = useSelf();

  return (
    <AsyncSection
      query={selfQuery}
      isEmpty={(self) => !self}
      empty={null}
      loading={<></>}
      error={<></>}
    >
      {(self) => <h1 className={styles.h4}>Hello, {self.name}</h1>}
    </AsyncSection>
  );
};

export default DashboardUserName;
