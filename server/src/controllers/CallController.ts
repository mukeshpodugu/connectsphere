import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Call from '../models/Call';

export const initiateCallLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callerId = new mongoose.Types.ObjectId(req.user?.id);
    const { receiverId, callType } = req.body;

    if (!receiverId || !callType) {
      return res.status(400).json({ success: false, message: 'Receiver ID and Call Type are required.' });
    }

    const newCall = new Call({
      callerId,
      receiverId: new mongoose.Types.ObjectId(receiverId),
      callType,
      status: 'ringing'
    });

    await newCall.save();

    res.status(201).json({ success: true, call: newCall });
  } catch (error) {
    next(error);
  }
};

export const updateCallLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { callId } = req.params;
    const { status, startTime, endTime, duration } = req.body;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call log not found.' });
    }

    if (status) call.status = status;
    if (startTime) call.startTime = new Date(startTime);
    if (endTime) call.endTime = new Date(endTime);
    if (duration !== undefined) call.duration = duration;

    await call.save();

    res.status(200).json({ success: true, call });
  } catch (error) {
    next(error);
  }
};

export const getCallHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.id);

    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
      .populate('callerId', 'username avatarUrl')
      .populate('receiverId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({ success: true, calls });
  } catch (error) {
    next(error);
  }
};
