
import { getLeadsCount } from '../utilis/ManageLeads/leadsCount.js';

export const manageLeads = async (req, res) => {
  try {
    const vendor_id = req.query.vendor_id;

    if (!vendor_id) {
      return res.status(400).json({ error: 'vendor_id is required' });
    }

    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      srch_value: req.query.srch_value,  
      srch_by: req.query.srch_by,
      action: req.query.action,
      status: req.query.status
    };

    const leadsData = await getLeadsCount(vendor_id, filters);

    return res.status(200).json({
      success: true,
      data: leadsData
    });
  } catch (error) {
    console.error('Error in manageLeads controller:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
 