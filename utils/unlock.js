exports.isUnlocked = (weekIndex, startDate) => {
  const now = new Date();
  const unlockDate = new Date(startDate);
  unlockDate.setDate(unlockDate.getDate() + (7 * weekIndex));

  return now >= unlockDate;
};