export type PubMedSearchResult = {
  esearchresult: {
    count: number;
    retmax: number;
    retstart: number;
    idlist: string[];
  };
};

export type PubMedAuthor = {
  name: string;
  authtype: string;
  clusterid: string;
};

export type PubMedArticleId = {
  idtype: string;
  idtypen: number;
  value: string;
};

export type PubMedSrcContribList = {
  name: string;
  authtype: string;
  clusterid: string;
};

export type PubMedDocContribList = {
  name: string;
  authtype: string;
  clusterid: string;
};

export type PubMedSearchSummary = {
  uid: string;
  pubdate: string;
  epubdate: string;
  source: string;
  authors: PubMedAuthor[];
  lastauthor: string;
  title: string;
  sorttitle: string;
  volume: string;
  issue: string;
  pages: string;
  lang: string[];
  nlmuniqueid: string;
  issn: string;
  essn: string;
  pubtype: string[];
  recordstatus: string;
  pubstatus: string;
  articleids: PubMedArticleId[];
  history: [];
  references: [];
  attributes: string[];
  pmcrefcount: string;
  fulljournalname: string;
  elocationid: string;
  doctype: string;
  srccontriblist: PubMedSrcContribList[];
  booktitle: string;
  medium: string;
  edition: string;
  publisherlocation: string;
  publishername: string;
  srcdate: string;
  reportnumber: string;
  availablefromurl: string;
  locationlabel: string;
  doccontriblist: PubMedDocContribList[];
  docdate: string;
  bookname: string;
  chapter: string;
  sortpubdate: string;
  sortfirstauthor: string;
  vernaculartitle: string;
};
