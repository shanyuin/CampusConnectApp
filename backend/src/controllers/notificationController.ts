import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { sendNotification } from '../services/firebaseAdmin';

export const saveToken = async (req: Request, res: Response) => {
  try {
    const { erpid, token } = req.body;

    if (!erpid || !token) {
      return res.status(400).json({ error: 'erpid and token are required' });
    }

    // Upsert the token
    const { error } = await supabase
      .from('fcm_tokens')
      .upsert(
        { erpid, token },
        { onConflict: 'erpid' } // Assuming token is unique
      );

    if (error) {
      console.error('Error saving token:', error);
      return res.status(500).json({ error: 'Failed to save token' });
    }

    res.json({ success: true, message: 'Token saved successfully' });
  } catch (error) {
    console.error('Error in saveToken:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const triggerNotification = async (req: Request, res: Response) => {
  try {
    const { erpid, type } = req.body;

    if (!erpid) {
      return res.status(400).json({ error: 'erpid is required' });
    }

    await sendNotification(erpid, type);
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error in triggerNotification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};
