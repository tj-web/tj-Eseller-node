import ejs from "ejs";
import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderTemplate = async (templateName, data = {}) => {
  const templatePath = path.join(__dirname, "../templates/", `${templateName}.ejs`);

  return ejs.renderFile(templatePath, data);
};