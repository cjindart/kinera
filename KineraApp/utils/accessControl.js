export const hasAccessToScreen = (userType, screenName) => {
  // All users can access Profile
  if (screenName === "Profile") {
    return true;
  }

  // Dater & Match Maker can access everything
  if (userType === "Dater & Match Maker") {
    return true;
  }

  // Dater can't access Home
  if (userType === "Dater" && screenName === "Home") {
    return false;
  }

  // Match Maker can't access MatchPortal
  if (userType === "Match Maker" && screenName === "MatchPortal") {
    return false;
  }

  // Default to allowing access
  return true;
};
