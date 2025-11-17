
export const formatDate = (date) => {
  if (!date) return '';
  // Convert Firestore Timestamp to JavaScript Date object if necessary
  const jsDate = date.toDate ? date.toDate() : new Date(date);
  if (isNaN(jsDate.getTime())) return '';

  let day = jsDate.getDate().toString().padStart(2, '0');
  let month = (jsDate.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
  let year = jsDate.getFullYear();

  return `${day}/${month}/${year}`;
};
