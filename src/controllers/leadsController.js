import { addRemarkReminderUtil } from "../models/leads.model.js";
import { getLeadsCount } from "../models/leads.model.js";
import { getLeadHistory } from "../models/leads.model.js";
import { getDemosCount } from "../models/leads.model.js";
//--------------------Manage Lead History-----------------------------------------------------

export const manageLeads = async (req, res) => {
  try {
    const vendor_id = req.query.vendor_id;

    if (!vendor_id) {
      return res.status(400).json({ error: "vendor_id is required" });
    }

    const filters = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      srch_value: req.query.srch_value,
      srch_by: req.query.srch_by,
      action: req.query.action,
      status: req.query.status
    };

    const leadsData = await getLeadsCount(vendor_id, filters, req.query.limit,req.query.pageNumber);

    return res.status(200).json({
      success: true,
      data: leadsData,
    });
  } catch (error) {
    console.error("Error in manageLeads controller:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// -----------------------------get Lead History API--------------------------------------

export const getLeadHistoryPost = async (req, res) => {
  const params = req.body;
  try {
    if (!params.profile_id) {
      throw new Error("Profile Id field is required.");
    }

    if (!params.vendor_id) {
      throw new Error("Vendor Id field is required.");
    }

    if (!params.lead_id) {
      throw new Error("Lead Id is required.");
    }
    console.log(">>>>",params)

    const history = await getLeadHistory(params.lead_id);
    if (history.length > 0) {
      return res.status(200).json({
        status: true,
        message: "Leads History fetched successfully",
        data: history,
      });
    } else {
      return res.status(200).json({
        status: false,
        message: "No history found",
        data: "",
      });
    }
  } catch (error) {
    return res.status(200).json({
      status: false,
      message: error.message,
    });
  }
};

//---------------------------add Remark API --------------------------------------


export const addRemarkReminder = async (req, res) => {
  try {
    const { lead_id, remark } = req.body;
    if (!lead_id || !remark) {
      return res.status(404).json({
        status: false,
        message: "lead_id and remark are required",
      });
    }

    const save = await addRemarkReminderUtil({ lead_id, remark });

    return res.status(200).json(save);
  } catch (error) {
    return res.status(200).json({
      status: false,
      message: error.message,
    });
  }
};


// ----------------------------My_Demos API -----------------------------------------------


// export const getDemosCountController = async (req, res) => {
//   try {
//     const { vendor_id, flg, acd_uuid, ...search_filter } = req.query;

//     if (!vendor_id) {
//       return res.status(400).json({
//         status: false,
//         message: "vendor_id is required",
//       });
//     }

//     const total = await getDemosCount(vendor_id, search_filter, flg, acd_uuid);

//     return res.json({
//       status: true,
//       message: "Demos count fetched successfully",
//       data: {
//         vendor_id,
//         total,
//       },
//     });
//   } catch (error) {
//     console.error("Error in getDemosCountController:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// import { getDemosCount } from "../models/ManageLeads/myDemos.js";

export const getDemosCountController = async (req, res) => {
  try {
    const { vendor_id, flg, acd_uuid, limit ,pageNumber,...search_filter } = req.query;

    if (!vendor_id) {
      return res.status(400).json({
        status: false,
        message: "vendor_id is required",
      });
    }

    const data = await getDemosCount(vendor_id, search_filter, flg, acd_uuid,limit,pageNumber);

    return res.json({
      status: true,
      message: "Demos fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error in getDemosCountController:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};


