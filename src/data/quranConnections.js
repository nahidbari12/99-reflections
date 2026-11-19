// One primary Qur'an connection for each Name, in the same order as names.jsx.
// "direct" means the Name or a directly corresponding Divine description appears
// in the ayah. "contextual" means the traditional Name is drawn from the action,
// quality, or wording of the ayah rather than appearing as the exact title.
const references = [
  "1:3","1:3","59:23","59:23","59:23","59:23","59:23","59:23","59:23","59:23",
  "59:24","59:24","59:24","38:66","12:39","38:35","51:58","34:26","2:32","2:245",
  "2:245","56:3","56:3","3:26","3:26","2:127","17:1","6:114","6:115","6:103",
  "6:18","2:235","2:255","2:173","35:30","2:255","13:9","11:57","4:85","4:6",
  "55:27","82:6","5:117","11:61","2:115","2:32","85:14","11:73","22:7","5:117",
  "6:62","6:102","8:52","51:58","42:9","2:267","72:28","85:13","85:13","2:28",
  "2:28","2:255","2:255","6:59","11:73","12:39","112:1","112:2","6:65","54:42",
  "16:61","71:4","57:3","57:3","57:3","57:3","13:11","13:9","52:28","2:37",
  "32:22","4:43","2:143","3:26","55:27","3:18","3:9","6:133","9:28","67:21",
  "6:17","10:107","24:35","25:31","2:117","55:27","15:23","18:10","2:153"
];

const contextual = new Set([20,21,22,23,24,25,28,29,41,49,57,58,59,60,61,64,65,71,72,77,86,89,90,91,92,96,98,99]);

export const quranConnections = references.map((reference, index) => {
  const [surah, ayah] = reference.split(":").map(Number);
  return { surah, ayah, reference, type: contextual.has(index + 1) ? "contextual" : "direct" };
});

export function getQuranConnection(nameIndex) { return quranConnections[nameIndex] || null; }
export function quranConnectionLabel(connection) { return connection?.type === "direct" ? "Direct Qur’an mention" : "Qur’anic context for this attribute"; }
