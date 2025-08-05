import { getOemPlansWithRawSQL } from '../utilis/oemService.js';
import { prepareOemPlansData } from '../helpers/oemHelper.js';

export const fetchPlansInfo = async (req, res) => {
  const { fetch_plans_info, vendor_id } = req.query;

  if (fetch_plans_info == 1) {
    try {
      const rawPlans = await getOemPlansWithRawSQL(vendor_id);
      const preparedPlans = prepareOemPlansData(rawPlans);
      return res.json({ plans: preparedPlans });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch plans data' });
    }
  }

  return res.status(400).json({ message: 'fetch_plans_info is not set to 1' });
};
