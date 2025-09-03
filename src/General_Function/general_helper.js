import sequelize from "../db/connection.js";

export function objectKeyDiff(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = new Set(Object.keys(obj2));

  return keys1.filter((key) => !keys2.has(key));
}

export function getCurrentDateNoHIs() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();


  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");

  const minutes = String(now.getMinutes()).padStart(2, "0");

  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function findDifferences(oldData, newData) {
  const differences = {};

  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      differences[key] = {
        old: oldData[key] || null,
        new: newData[key] || null,
      };
    }
  }

  return differences;
}

/*******update record function****** */

export const updateRecord = async (table, where, data) => {
  try {
    const setClauses = Object.keys(data)
      .map((key) => `${key} = :set_${key}`)
      .join(", ");

    const whereClauses = Object.keys(where)
      .map((key) => `${key} = :where_${key}`)
      .join(" AND ");

    const replacements = {};

    Object.entries(data).forEach(([key, value]) => {
      replacements[`set_${key}`] = value;
    });

    Object.entries(where).forEach(([key, value]) => {
      replacements[`where_${key}`] = value;
    });

    const query = `UPDATE ${table} SET ${setClauses} WHERE ${whereClauses}`;

    const [result] = await sequelize.query(query, { replacements });

    return result;
  } catch (error) {
    console.error("Error updating record:", error);
    throw error;
  }
};

/*********insert record function */

export const insertRecordWithoutId = async (table, data) => {
  try {
    const columns = Object.keys(data).join(", ");
    const values = Object.keys(data)
      .map((key) => `:${key}`)
      .join(", ");

    const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;

    await sequelize.query(query, {
      replacements: data,
    });

    return true;
  } catch (error) {
    console.error("Error inserting record:", error);
    throw error;
  }
};
