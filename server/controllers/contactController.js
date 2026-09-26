import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendContactReply, sendContactNotification } from '../config/email.js';
import { emitToRole } from '../config/socket.js';

/**
 * Submit contact message (public)
 */
export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new AppError('All fields are required', 400);
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Please provide a valid email address', 400);
    }

    // Insert message
    const result = await query(
      `INSERT INTO contact_messages (name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, 'unread')
       RETURNING id, name, email, subject, message, created_at`,
      [name.trim(), email.toLowerCase().trim(), subject.trim(), message.trim()]
    );

    const messageRow = result.rows[0];

    // Real-time notify admin panel
    try {
      emitToRole('admin', 'admin:message', {
        id: messageRow.id,
        name: messageRow.name,
        subject: messageRow.subject,
      });
      emitToRole('admin', 'admin:badges', { source: 'contact' });
    } catch (socketError) {
      console.error('Socket emit error (contact):', socketError);
    }

    // Notify all admins about the new message (best-effort, non-blocking)
    try {
      const adminResult = await query(
        `SELECT email FROM users WHERE role = 'admin' AND email IS NOT NULL AND email != ''`
      );
      const adminEmails = adminResult.rows.map((row) => row.email);
      await sendContactNotification(adminEmails, messageRow);
    } catch (notifyError) {
      console.error('Contact admin notification failed:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: messageRow
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all contact messages (admin only)
 */
export const getAllMessages = async (req, res, next) => {
  try {
    const { status } = req.query;

    let queryText = `
      SELECT 
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.status,
        cm.admin_reply,
        cm.replied_at,
        cm.created_at,
        cm.updated_at,
        u.first_name || ' ' || u.last_name AS replied_by_name
      FROM contact_messages cm
      LEFT JOIN users u ON cm.replied_by = u.id
    `;

    const params = [];
    
    if (status && status !== 'all') {
      queryText += ' WHERE cm.status = $1';
      params.push(status);
    }

    queryText += ' ORDER BY cm.created_at DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single message (admin only)
 */
export const getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.status,
        cm.admin_reply,
        cm.replied_at,
        cm.created_at,
        cm.updated_at,
        u.first_name || ' ' || u.last_name AS replied_by_name
      FROM contact_messages cm
      LEFT JOIN users u ON cm.replied_by = u.id
      WHERE cm.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    // Mark as read if unread
    if (result.rows[0].status === 'unread') {
      await query(
        `UPDATE contact_messages SET status = 'read' WHERE id = $1`,
        [id]
      );
      result.rows[0].status = 'read';
      try {
        emitToRole('admin', 'admin:badges', { source: 'contact-read' });
      } catch (socketError) {
        console.error('Socket emit error (contact read):', socketError);
      }
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to message (admin only)
 */
export const replyToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const adminId = req.user.id;

    if (!reply || !reply.trim()) {
      throw new AppError('Reply message is required', 400);
    }

    // Get message details
    const messageResult = await query(
      'SELECT name, email, subject FROM contact_messages WHERE id = $1',
      [id]
    );

    if (messageResult.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    const message = messageResult.rows[0];

    // Update message with reply
    await query(
      `UPDATE contact_messages 
       SET admin_reply = $1, replied_by = $2, replied_at = CURRENT_TIMESTAMP, status = 'replied'
       WHERE id = $3`,
      [reply.trim(), adminId, id]
    );

    try {
      emitToRole('admin', 'admin:badges', { source: 'contact-reply' });
    } catch (socketError) {
      console.error('Socket emit error (contact reply):', socketError);
    }

    // Send email reply
    try {
      await sendContactReply(
        message.email,
        message.name,
        message.subject,
        reply.trim()
      );
      console.log(`✅ Contact reply sent to ${message.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'Reply sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update message status (admin only)
 */
export const updateMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['unread', 'read', 'replied', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError('Invalid status. Must be: unread, read, replied, or archived', 400);
    }

    const result = await query(
      'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    try {
      emitToRole('admin', 'admin:badges', { source: 'contact-status' });
    } catch (socketError) {
      console.error('Socket emit error (contact status):', socketError);
    }

    res.json({
      success: true,
      message: 'Message status updated',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete message (admin only)
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Message not found', 404);
    }

    try {
      emitToRole('admin', 'admin:badges', { source: 'contact-delete' });
    } catch (socketError) {
      console.error('Socket emit error (contact delete):', socketError);
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message statistics (admin only)
 */
export const getMessageStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'unread') as unread_count,
        COUNT(*) FILTER (WHERE status = 'read') as read_count,
        COUNT(*) FILTER (WHERE status = 'replied') as replied_count,
        COUNT(*) as total_count
      FROM contact_messages
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
