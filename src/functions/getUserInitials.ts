const getInitials = (name: string): string => {
  if (!name) return "";
  const nameParts = name.trim().split(/\s+/);

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  const initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
  return initials.toUpperCase();
};

export default getInitials;
