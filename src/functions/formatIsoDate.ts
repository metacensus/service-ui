import { format, parseISO } from "date-fns";

const formatIsoDate = (date: string) => {
  return format(parseISO(date), "MMMM do, yyyy h:mm:ss a");
};

export default formatIsoDate;
