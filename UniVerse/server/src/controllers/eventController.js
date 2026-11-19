import mongoose from 'mongoose';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { EVENT_CATEGORIES, REGISTRATION_STATUS } from '../utils/constants.js';

export const getEvents = async (req, res, next) => {
  try {
    const { search, category, timeframe = 'upcoming', sort = 'date-asc' } = req.query;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { venue: searchRegex },
      ];
    }

    if (category && category !== 'All') {
      if (EVENT_CATEGORIES.includes(category)) {
        query.category = category;
      }
    }

    const now = new Date();
    if (timeframe === 'upcoming') {
      query.endDate = { $gte: now };
    } else if (timeframe === 'past') {
      query.endDate = { $lt: now };
    }

    let sortOption = { startDate: 1 };
    if (sort === 'date-desc') {
      sortOption = { startDate: -1 };
    } else if (sort === 'title-asc') {
      sortOption = { title: 1 };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email role')
      .sort(sortOption)
      .lean();

    let userRegistrationsMap = new Set();
    if (req.user) {
      const userRegistrations = await EventRegistration.find({
        user: req.user._id,
        status: REGISTRATION_STATUS.REGISTERED,
      }).select('event');

      userRegistrationsMap = new Set(
        userRegistrations.map((reg) => reg.event.toString())
      );
    }

    const enhancedEvents = events.map((event) => {
      const isRegistered = userRegistrationsMap.has(event._id.toString());
      const isFull = event.maxCapacity !== null && event.registeredCount >= event.maxCapacity;
      const isDeadlinePassed = event.registrationDeadline && now > new Date(event.registrationDeadline);
      const isStarted = now > new Date(event.startDate);

      return {
        ...event,
        isUserRegistered: isRegistered,
        isFull,
        isRegistrationOpen: !isFull && !isDeadlinePassed && !isStarted,
        remainingSpots:
          event.maxCapacity !== null
            ? Math.max(0, event.maxCapacity - event.registeredCount)
            : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: enhancedEvents.length,
      events: enhancedEvents,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id).populate('createdBy', 'name email role department');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    let isUserRegistered = false;
    if (req.user) {
      const existingReg = await EventRegistration.findOne({
        event: id,
        user: req.user._id,
        status: REGISTRATION_STATUS.REGISTERED,
      });
      isUserRegistered = !!existingReg;
    }

    const now = new Date();
    const isFull = event.maxCapacity !== null && event.registeredCount >= event.maxCapacity;
    const isDeadlinePassed = event.registrationDeadline && now > new Date(event.registrationDeadline);
    const isStarted = now > new Date(event.startDate);

    return res.status(200).json({
      success: true,
      event: {
        ...event.toJSON(),
        isUserRegistered,
        isFull,
        isRegistrationOpen: !isFull && !isDeadlinePassed && !isStarted,
        remainingSpots:
          event.maxCapacity !== null
            ? Math.max(0, event.maxCapacity - event.registeredCount)
            : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      maxCapacity,
      posterUrl,
    } = req.body;

    if (!title || !description || !category || !venue || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, venue, startDate, and endDate.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid start and end dates.',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date and time must be after the start date and time.',
      });
    }

    if (!EVENT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${EVENT_CATEGORIES.join(', ')}`,
      });
    }

    let capacity = null;
    if (maxCapacity !== undefined && maxCapacity !== null && maxCapacity !== '') {
      capacity = Number(maxCapacity);
      if (isNaN(capacity) || capacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Maximum capacity must be a positive integer (at least 1).',
        });
      }
    }

    let deadline = null;
    if (registrationDeadline) {
      deadline = new Date(registrationDeadline);
      if (isNaN(deadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid registration deadline date.',
        });
      }
    }

    const newEvent = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category,
      venue: venue.trim(),
      startDate: start,
      endDate: end,
      registrationDeadline: deadline,
      maxCapacity: capacity,
      registeredCount: 0,
      posterUrl: posterUrl ? posterUrl.trim() : '',
      createdBy: req.user._id,
    });

    const populatedEvent = await Event.findById(newEvent._id).populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event: populatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const {
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      registrationDeadline,
      maxCapacity,
      posterUrl,
    } = req.body;

    const updates = {};

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (venue !== undefined) updates.venue = venue.trim();
    if (posterUrl !== undefined) updates.posterUrl = posterUrl.trim();

    if (category !== undefined) {
      if (!EVENT_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${EVENT_CATEGORIES.join(', ')}`,
        });
      }
      updates.category = category;
    }

    const finalStart = startDate ? new Date(startDate) : existingEvent.startDate;
    const finalEnd = endDate ? new Date(endDate) : existingEvent.endDate;

    if (startDate !== undefined) updates.startDate = finalStart;
    if (endDate !== undefined) updates.endDate = finalEnd;

    if (finalEnd < finalStart) {
      return res.status(400).json({
        success: false,
        message: 'End date and time must be after the start date and time.',
      });
    }

    if (registrationDeadline !== undefined) {
      updates.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    }

    if (maxCapacity !== undefined) {
      if (maxCapacity === null || maxCapacity === '') {
        updates.maxCapacity = null;
      } else {
        const capacity = Number(maxCapacity);
        if (isNaN(capacity) || capacity < 1) {
          return res.status(400).json({
            success: false,
            message: 'Maximum capacity must be a positive integer (at least 1).',
          });
        }
        if (capacity < existingEvent.registeredCount) {
          return res.status(400).json({
            success: false,
            message: `Capacity (${capacity}) cannot be lower than existing registered attendees (${existingEvent.registeredCount}).`,
          });
        }
        updates.maxCapacity = capacity;
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const deletedRegistrations = await EventRegistration.deleteMany({ event: id });
    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Event deleted successfully along with ${deletedRegistrations.deletedCount} related registration records.`,
    });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const now = new Date();

    if (now > event.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for an event that has already started.',
      });
    }

    if (event.registrationDeadline && now > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'The registration deadline for this event has passed.',
      });
    }

    const existingRegistration = await EventRegistration.findOne({
      event: id,
      user: req.user._id,
    });

    if (existingRegistration) {
      if (existingRegistration.status === REGISTRATION_STATUS.REGISTERED) {
        return res.status(409).json({
          success: false,
          message: 'You are already registered for this event.',
        });
      }
    }

    const capacityCondition = {
      _id: id,
      $or: [
        { maxCapacity: null },
        { $expr: { $lt: ['$registeredCount', '$maxCapacity'] } },
      ],
    };

    const updatedEvent = await Event.findOneAndUpdate(
      capacityCondition,
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: 'This event has reached its maximum capacity. Registration is closed.',
      });
    }

    let registration;
    try {
      if (existingRegistration) {
        existingRegistration.status = REGISTRATION_STATUS.REGISTERED;
        existingRegistration.registeredAt = new Date();
        registration = await existingRegistration.save();
      } else {
        registration = await EventRegistration.create({
          event: id,
          user: req.user._id,
          status: REGISTRATION_STATUS.REGISTERED,
          registeredAt: new Date(),
        });
      }
    } catch (regError) {
      await Event.findByIdAndUpdate(id, { $inc: { registeredCount: -1 } });
      throw regError;
    }

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for this event!',
      registration,
      registeredCount: updatedEvent.registeredCount,
      remainingSpots:
        updatedEvent.maxCapacity !== null
          ? Math.max(0, updatedEvent.maxCapacity - updatedEvent.registeredCount)
          : null,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const registration = await EventRegistration.findOne({
      event: id,
      user: req.user._id,
      status: REGISTRATION_STATUS.REGISTERED,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No active registration found for this event.',
      });
    }

    await EventRegistration.findByIdAndDelete(registration._id);

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $inc: { registeredCount: -1 } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully.',
      registeredCount: updatedEvent ? updatedEvent.registeredCount : 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({
      user: req.user._id,
      status: REGISTRATION_STATUS.REGISTERED,
    })
      .sort({ registeredAt: -1 })
      .populate({
        path: 'event',
        populate: { path: 'createdBy', select: 'name email' },
      });

    const validRegistrations = registrations
      .filter((reg) => reg.event !== null)
      .map((reg) => ({
        registrationId: reg._id,
        registeredAt: reg.registeredAt,
        status: reg.status,
        event: reg.event,
      }));

    return res.status(200).json({
      success: true,
      count: validRegistrations.length,
      registrations: validRegistrations,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const registrations = await EventRegistration.find({
      event: id,
      status: REGISTRATION_STATUS.REGISTERED,
    })
      .populate('user', 'name email department academicYear avatarUrl')
      .sort({ registeredAt: -1 });

    const attendees = registrations.map((r) => ({
      registrationId: r._id,
      registeredAt: r.registeredAt,
      user: r.user,
    }));

    return res.status(200).json({
      success: true,
      eventTitle: event.title,
      count: attendees.length,
      attendees,
    });
  } catch (error) {
    next(error);
  }
};
