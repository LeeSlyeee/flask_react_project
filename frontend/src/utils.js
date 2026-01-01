export const formatUsername = (userID) => {
  if (!userID) return '';
  return userID.split('@')[0];
};
