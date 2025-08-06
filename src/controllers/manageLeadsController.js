import { getLeadsCount } from '../utilis/ManageLeads/leadsCount.js'; //  Make sure path is correct
// Controller to get leads count
export const manageLeads = async (req, res) => {
  try {
    const vendor_id = req.body.vendor_id; // or req.session.vendor_id if needed

    if (!vendor_id) {
      return res.status(400).json({ error: 'vendor_id is required' });
    }

    //  Direct function call (not as object)
    const totalLeads = await getLeadsCount(vendor_id);

    return res.status(200).json({
      success: true,
      total: totalLeads
    });
  } catch (error) {
    console.error('Error in manageLeads controller:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
