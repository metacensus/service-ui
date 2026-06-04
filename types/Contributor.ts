export type Group = {
  id: number;
  name: string;
  role: string;
};

export type Contributor = {
  id: string;
  name: string;
  email: string;
  bio: string;
  jobTitle: string;
  joinedAt: string;
  groups: Group[];
  topics: string[];
};
