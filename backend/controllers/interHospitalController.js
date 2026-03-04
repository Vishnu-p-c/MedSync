const Hospital = require('../models/Hospital');
const HospitalAdmin = require('../models/HospitalAdmin');
const InterHospitalMessage = require('../models/InterHospitalMessage');

// GET /hospital/inter-message/hospitals - List all hospitals (excluding
// sender's own)
const listHospitals = async (req, res) => {
  try {
    const {admin_id} = req.query;

    if (!admin_id) {
      return res.json({status: 'fail', message: 'admin_id_required'});
    }

    const adminIdNum = parseInt(admin_id);
    if (isNaN(adminIdNum)) {
      return res.json({status: 'fail', message: 'admin_id_must_be_number'});
    }

    // Find admin's hospital
    const adminRecord =
        await HospitalAdmin.findOne({admin_id: adminIdNum}).lean();
    if (!adminRecord || !adminRecord.hospital_id) {
      return res.json(
          {status: 'fail', message: 'admin_not_found_or_no_hospital'});
    }

    // Get all hospitals except the admin's own — exclude clinics
    const hospitals = await Hospital
                          .find(
                              {hospital_id: {$ne: adminRecord.hospital_id}},
                              {hospital_id: 1, name: 1, address: 1, _id: 0})
                          .sort({name: 1})
                          .lean();

    return res.json({
      status: 'success',
      own_hospital_id: adminRecord.hospital_id,
      hospitals,
      total: hospitals.length
    });

  } catch (error) {
    console.error('Error listing hospitals:', error);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

// POST /hospital/inter-message/send - Send message to one or all hospitals
const sendInterHospitalMessage = async (req, res) => {
  try {
    const {admin_id, hospital_ids, message, subject, priority} = req.body;

    // Validate required fields
    if (!admin_id || !hospital_ids || !message) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !admin_id && 'admin_id', !hospital_ids && 'hospital_ids',
          !message && 'message'
        ].filter(Boolean)
      });
    }

    const adminIdNum = parseInt(admin_id);
    if (isNaN(adminIdNum)) {
      return res.json({status: 'fail', message: 'admin_id_must_be_number'});
    }

    if (!message.trim()) {
      return res.json({status: 'fail', message: 'message_cannot_be_empty'});
    }

    // Find admin's hospital
    const adminRecord =
        await HospitalAdmin.findOne({admin_id: adminIdNum}).lean();
    if (!adminRecord || !adminRecord.hospital_id) {
      return res.json(
          {status: 'fail', message: 'admin_not_found_or_no_hospital'});
    }

    const fromHospitalId = adminRecord.hospital_id;
    const fromHospital =
        await Hospital.findOne({hospital_id: fromHospitalId}).lean();
    if (!fromHospital) {
      return res.json({status: 'fail', message: 'sender_hospital_not_found'});
    }

    // Determine target hospitals
    let targetHospitalIds = [];
    let isBroadcast = false;

    if (hospital_ids === 'all') {
      isBroadcast = true;
      const allHospitals =
          await Hospital
              .find({hospital_id: {$ne: fromHospitalId}}, {hospital_id: 1})
              .lean();
      targetHospitalIds = allHospitals.map(h => h.hospital_id);
    } else if (Array.isArray(hospital_ids)) {
      targetHospitalIds =
          hospital_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      // Remove own hospital
      targetHospitalIds = targetHospitalIds.filter(id => id !== fromHospitalId);
    } else {
      return res.json(
          {status: 'fail', message: 'hospital_ids_must_be_array_or_all'});
    }

    if (targetHospitalIds.length === 0) {
      return res.json({status: 'fail', message: 'no_target_hospitals'});
    }

    // Verify target hospitals exist
    const existingHospitals =
        await Hospital
            .find({hospital_id: {$in: targetHospitalIds}}, {hospital_id: 1})
            .lean();
    const existingIds = new Set(existingHospitals.map(h => h.hospital_id));

    // Get next message_id
    const lastMsg = await InterHospitalMessage.findOne()
                        .sort({message_id: -1})
                        .select('message_id')
                        .lean();
    let nextMsgId = (lastMsg ? lastMsg.message_id : 0) + 1;

    const results = {
      total_hospitals: targetHospitalIds.length,
      messages_sent: 0,
      hospitals_not_found: 0
    };

    const messagePriority = priority || 'normal';
    const messageSubject = subject || '';

    // Create messages for each target hospital
    const messageDocs = [];
    for (const toHospitalId of targetHospitalIds) {
      if (!existingIds.has(toHospitalId)) {
        results.hospitals_not_found++;
        continue;
      }
      messageDocs.push({
        message_id: nextMsgId++,
        from_hospital_id: fromHospitalId,
        to_hospital_id: toHospitalId,
        from_admin_id: adminIdNum,
        message: message.substring(0, 2000),
        subject: messageSubject.substring(0, 200),
        priority: messagePriority,
        is_broadcast: isBroadcast,
        is_read: false,
        timestamp: new Date()
      });
    }

    if (messageDocs.length > 0) {
      await InterHospitalMessage.insertMany(messageDocs);
      results.messages_sent = messageDocs.length;
    }

    return res.json({
      status: 'success',
      message: 'messages_sent',
      from_hospital_id: fromHospitalId,
      from_hospital_name: fromHospital.name,
      is_broadcast: isBroadcast,
      results
    });

  } catch (error) {
    console.error('Error sending inter-hospital message:', error);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

// GET /hospital/inter-message/inbox - Get received messages
const getInbox = async (req, res) => {
  try {
    const {admin_id, unread_only, page, limit} = req.query;

    if (!admin_id) {
      return res.json({status: 'fail', message: 'admin_id_required'});
    }

    const adminIdNum = parseInt(admin_id);
    if (isNaN(adminIdNum)) {
      return res.json({status: 'fail', message: 'admin_id_must_be_number'});
    }

    const adminRecord =
        await HospitalAdmin.findOne({admin_id: adminIdNum}).lean();
    if (!adminRecord || !adminRecord.hospital_id) {
      return res.json(
          {status: 'fail', message: 'admin_not_found_or_no_hospital'});
    }

    const myHospitalId = adminRecord.hospital_id;
    const query = {to_hospital_id: myHospitalId};

    if (unread_only === 'true') {
      query.is_read = false;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      InterHospitalMessage.find(query)
          .sort({timestamp: -1})
          .skip(skip)
          .limit(limitNum)
          .lean(),
      InterHospitalMessage.countDocuments(query)
    ]);

    // Enrich with hospital names
    const fromIds = [...new Set(messages.map(m => m.from_hospital_id))];
    const hospitals =
        await Hospital
            .find({hospital_id: {$in: fromIds}}, {hospital_id: 1, name: 1})
            .lean();
    const hospitalMap = {};
    hospitals.forEach(h => hospitalMap[h.hospital_id] = h.name);

    const enrichedMessages =
        messages.map(m => ({
                       ...m,
                       from_hospital_name:
                           hospitalMap[m.from_hospital_id] || 'Unknown Hospital'
                     }));

    const unreadCount = await InterHospitalMessage.countDocuments(
        {to_hospital_id: myHospitalId, is_read: false});

    return res.json({
      status: 'success',
      messages: enrichedMessages,
      total,
      unread_count: unreadCount,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    console.error('Error getting inbox:', error);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

// POST /hospital/inter-message/mark-read - Mark message(s) as read
const markMessageRead = async (req, res) => {
  try {
    const {admin_id, message_ids} = req.body;

    if (!admin_id || !message_ids) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !admin_id && 'admin_id', !message_ids && 'message_ids'
        ].filter(Boolean)
      });
    }

    const adminIdNum = parseInt(admin_id);
    if (isNaN(adminIdNum)) {
      return res.json({status: 'fail', message: 'admin_id_must_be_number'});
    }

    const adminRecord =
        await HospitalAdmin.findOne({admin_id: adminIdNum}).lean();
    if (!adminRecord || !adminRecord.hospital_id) {
      return res.json(
          {status: 'fail', message: 'admin_not_found_or_no_hospital'});
    }

    const msgIds = Array.isArray(message_ids) ?
        message_ids.map(id => parseInt(id)).filter(id => !isNaN(id)) :
        [parseInt(message_ids)].filter(id => !isNaN(id));

    if (msgIds.length === 0) {
      return res.json({status: 'fail', message: 'no_valid_message_ids'});
    }

    const result = await InterHospitalMessage.updateMany(
        {message_id: {$in: msgIds}, to_hospital_id: adminRecord.hospital_id},
        {$set: {is_read: true, read_at: new Date()}});

    return res.json({
      status: 'success',
      message: 'messages_marked_read',
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages read:', error);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

// POST /hospital/inter-message/reply - Reply to a message
const replyToMessage = async (req, res) => {
  try {
    const {admin_id, parent_message_id, message, priority} = req.body;

    if (!admin_id || !parent_message_id || !message) {
      return res.json({
        status: 'fail',
        message: 'missing_fields',
        missing: [
          !admin_id && 'admin_id', !parent_message_id && 'parent_message_id',
          !message && 'message'
        ].filter(Boolean)
      });
    }

    const adminIdNum = parseInt(admin_id);
    if (isNaN(adminIdNum)) {
      return res.json({status: 'fail', message: 'admin_id_must_be_number'});
    }

    if (!message.trim()) {
      return res.json({status: 'fail', message: 'message_cannot_be_empty'});
    }

    // Find admin's hospital
    const adminRecord =
        await HospitalAdmin.findOne({admin_id: adminIdNum}).lean();
    if (!adminRecord || !adminRecord.hospital_id) {
      return res.json(
          {status: 'fail', message: 'admin_not_found_or_no_hospital'});
    }

    // Find the parent message
    const parentMsg = await InterHospitalMessage
                          .findOne({message_id: parseInt(parent_message_id)})
                          .lean();
    if (!parentMsg) {
      return res.json({status: 'fail', message: 'parent_message_not_found'});
    }

    // Ensure this hospital was the recipient of the parent message
    if (parentMsg.to_hospital_id !== adminRecord.hospital_id) {
      return res.json({status: 'fail', message: 'not_authorized_to_reply'});
    }

    const fromHospitalId = adminRecord.hospital_id;
    const toHospitalId = parentMsg.from_hospital_id;

    const fromHospital =
        await Hospital.findOne({hospital_id: fromHospitalId}).lean();

    // Get next message_id
    const lastMsg = await InterHospitalMessage.findOne()
                        .sort({message_id: -1})
                        .select('message_id')
                        .lean();
    const nextMsgId = (lastMsg ? lastMsg.message_id : 0) + 1;

    const newMsg = new InterHospitalMessage({
      message_id: nextMsgId,
      from_hospital_id: fromHospitalId,
      to_hospital_id: toHospitalId,
      from_admin_id: adminIdNum,
      message: message.substring(0, 2000),
      subject: parentMsg.subject ? `Re: ${parentMsg.subject}` : '',
      priority: priority || parentMsg.priority || 'normal',
      is_broadcast: false,
      parent_message_id: parseInt(parent_message_id),
      is_read: false,
      timestamp: new Date()
    });

    await newMsg.save();

    // Mark original message as read
    await InterHospitalMessage.updateOne(
        {message_id: parseInt(parent_message_id)},
        {$set: {is_read: true, read_at: new Date()}});

    // Get target hospital name
    const toHospital =
        await Hospital.findOne({hospital_id: toHospitalId}).lean();

    return res.json({
      status: 'success',
      message: 'reply_sent',
      data: {
        message_id: nextMsgId,
        from_hospital_id: fromHospitalId,
        from_hospital_name: fromHospital ? fromHospital.name : 'Unknown',
        to_hospital_id: toHospitalId,
        to_hospital_name: toHospital ? toHospital.name : 'Unknown',
        parent_message_id: parseInt(parent_message_id),
        timestamp: newMsg.timestamp
      }
    });

  } catch (error) {
    console.error('Error replying to message:', error);
    return res.status(500).json({status: 'error', message: 'server_error'});
  }
};

module.exports = {
  listHospitals,
  sendInterHospitalMessage,
  getInbox,
  markMessageRead,
  replyToMessage
};
